// src/controllers/connectionController.js
import pool from "../config/db.js";
import notificationService from "../services/notificationService.js";

const connectionController = {
    // ==================== SEND CONNECTION REQUEST ====================
    sendConnectionRequest: async (req, res) => {
        try {
            const senderId = req.user.userId;
            const { receiver_id, message } = req.body;

            if (!receiver_id) {
                return res.status(400).json({
                    success: false,
                    error: "Receiver ID is required"
                });
            }

            // Can't send request to yourself
            if (senderId === parseInt(receiver_id)) {
                return res.status(400).json({
                    success: false,
                    error: "Cannot send connection request to yourself"
                });
            }

            // Check if receiver exists
            const receiverCheck = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND is_active = true",
                [receiver_id]
            );

            if (receiverCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            // Check if connection already exists
            const connectionCheck = await pool.query(
                `SELECT id FROM connections 
                 WHERE (user1_id = LEAST($1, $2) AND user2_id = GREATEST($1, $2))`,
                [senderId, receiver_id]
            );

            if (connectionCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: "Already connected with this user"
                });
            }

            // Check if pending request already exists
            const pendingCheck = await pool.query(
                `SELECT id, status FROM connection_requests 
                 WHERE ((sender_id = $1 AND receiver_id = $2) 
                    OR (sender_id = $2 AND receiver_id = $1))
                 AND status = 'pending'`,
                [senderId, receiver_id]
            );

            if (pendingCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: "Connection request already pending"
                });
            }

            // Create connection request
            const result = await pool.query(
                `INSERT INTO connection_requests (sender_id, receiver_id, message)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [senderId, receiver_id, message || null]
            );

            // Send notification to receiver
            await notificationService.notifyConnectionRequest(senderId, receiver_id);

            res.status(201).json({
                success: true,
                message: "Connection request sent successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Send connection request error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to send connection request"
            });
        }
    },

    // ==================== GET PENDING REQUESTS (RECEIVED) ====================
    getPendingRequests: async (req, res) => {
        try {
            const userId = req.user.userId;

            const result = await pool.query(
                `SELECT * FROM v_connection_requests
                 WHERE receiver_id = $1 AND status = 'pending'
                 ORDER BY requested_at DESC`,
                [userId]
            );

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get pending requests error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch pending requests"
            });
        }
    },

    // ==================== GET SENT REQUESTS ====================
    getSentRequests: async (req, res) => {
        try {
            const userId = req.user.userId;

            const result = await pool.query(
                `SELECT * FROM v_connection_requests
                 WHERE sender_id = $1 AND status = 'pending'
                 ORDER BY requested_at DESC`,
                [userId]
            );

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get sent requests error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch sent requests"
            });
        }
    },

    // ==================== ACCEPT CONNECTION REQUEST ====================
    acceptConnectionRequest: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { request_id } = req.params;

            // Check if request exists and user is the receiver
            const requestCheck = await pool.query(
                `SELECT * FROM connection_requests 
                 WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
                [request_id, userId]
            );

            if (requestCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Connection request not found or already responded"
                });
            }

            // Update request status (trigger will create connection)
            const result = await pool.query(
                `UPDATE connection_requests 
                 SET status = 'accepted'
                 WHERE id = $1
                 RETURNING sender_id`,
                [request_id]
            );

            const senderId = result.rows[0].sender_id;

            // Send notification to the original requester
            await notificationService.notifyConnectionAccepted(senderId, userId);

            res.status(200).json({
                success: true,
                message: "Connection request accepted"
            });

        } catch (error) {
            console.error("Accept connection error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to accept connection request"
            });
        }
    },

    // ==================== DECLINE CONNECTION REQUEST ====================
    declineConnectionRequest: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { request_id } = req.params;

            // Check if request exists and user is the receiver
            const requestCheck = await pool.query(
                `SELECT * FROM connection_requests 
                 WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
                [request_id, userId]
            );

            if (requestCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Connection request not found or already responded"
                });
            }

            // Update request status
            await pool.query(
                `UPDATE connection_requests 
                 SET status = 'declined'
                 WHERE id = $1`,
                [request_id]
            );

            res.status(200).json({
                success: true,
                message: "Connection request declined"
            });

        } catch (error) {
            console.error("Decline connection error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to decline connection request"
            });
        }
    },

    // ==================== CANCEL CONNECTION REQUEST ====================
    cancelConnectionRequest: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { request_id } = req.params;

            // Check if request exists and user is the sender
            const requestCheck = await pool.query(
                `SELECT * FROM connection_requests 
                 WHERE id = $1 AND sender_id = $2 AND status = 'pending'`,
                [request_id, userId]
            );

            if (requestCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Connection request not found or already responded"
                });
            }

            // Update request status
            await pool.query(
                `UPDATE connection_requests 
                 SET status = 'cancelled'
                 WHERE id = $1`,
                [request_id]
            );

            res.status(200).json({
                success: true,
                message: "Connection request cancelled"
            });

        } catch (error) {
            console.error("Cancel connection error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to cancel connection request"
            });
        }
    },

    // ==================== GET MY CONNECTIONS ====================
    getMyConnections: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 20, search } = req.query;
            const offset = (page - 1) * limit;

            let queryText = `
                SELECT * FROM v_user_connections
                WHERE (user1_id = $1 OR user2_id = $1)
            `;
            const queryParams = [userId];
            let paramCount = 1;

            if (search) {
                paramCount++;
                queryText += ` AND (
                    user1_name ILIKE $${paramCount} OR 
                    user2_name ILIKE $${paramCount} OR
                    user1_company ILIKE $${paramCount} OR
                    user2_company ILIKE $${paramCount}
                )`;
                queryParams.push(`%${search}%`);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalConnections = parseInt(countResult.rows[0].count);

            // Add pagination
            queryText += ` ORDER BY connected_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            // Format response to show the "other" user
            const connections = result.rows.map(conn => {
                const isUser1 = conn.user1_id === userId;
                return {
                    connection_id: conn.connection_id,
                    connected_at: conn.connected_at,
                    user: {
                        id: isUser1 ? conn.user2_full_id : conn.user1_full_id,
                        name: isUser1 ? conn.user2_name : conn.user1_name,
                        email: isUser1 ? conn.user2_email : conn.user1_email,
                        profile_picture: isUser1 ? conn.user2_picture : conn.user1_picture,
                        company: isUser1 ? conn.user2_company : conn.user1_company,
                        title: isUser1 ? conn.user2_title : conn.user1_title
                    }
                };
            });

            res.status(200).json({
                success: true,
                count: connections.length,
                total: totalConnections,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalConnections / limit)
                },
                data: connections
            });

        } catch (error) {
            console.error("Get connections error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch connections"
            });
        }
    },

    // ==================== REMOVE CONNECTION ====================
    removeConnection: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { connection_id } = req.params;

            // Check if connection exists and user is part of it
            const connectionCheck = await pool.query(
                `SELECT * FROM connections 
                 WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
                [connection_id, userId]
            );

            if (connectionCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Connection not found"
                });
            }

            // Delete connection
            await pool.query(
                "DELETE FROM connections WHERE id = $1",
                [connection_id]
            );

            res.status(200).json({
                success: true,
                message: "Connection removed successfully"
            });

        } catch (error) {
            console.error("Remove connection error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to remove connection"
            });
        }
    },

    // ==================== CHECK CONNECTION STATUS ====================
    checkConnectionStatus: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { user_id } = req.params;

            // Check if connected
            const connectionCheck = await pool.query(
                `SELECT id FROM connections 
                 WHERE (user1_id = LEAST($1, $2) AND user2_id = GREATEST($1, $2))`,
                [userId, user_id]
            );

            if (connectionCheck.rows.length > 0) {
                return res.status(200).json({
                    success: true,
                    status: "connected",
                    connection_id: connectionCheck.rows[0].id
                });
            }

            // Check if pending request exists
            const requestCheck = await pool.query(
                `SELECT id, sender_id, receiver_id, status FROM connection_requests 
                 WHERE ((sender_id = $1 AND receiver_id = $2) 
                    OR (sender_id = $2 AND receiver_id = $1))
                 AND status = 'pending'`,
                [userId, user_id]
            );

            if (requestCheck.rows.length > 0) {
                const request = requestCheck.rows[0];
                const isSender = request.sender_id === userId;
                
                return res.status(200).json({
                    success: true,
                    status: isSender ? "request_sent" : "request_received",
                    request_id: request.id
                });
            }

            res.status(200).json({
                success: true,
                status: "not_connected"
            });

        } catch (error) {
            console.error("Check connection status error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to check connection status"
            });
        }
    },

    // ==================== GET CONNECTION STATS ====================
    getConnectionStats: async (req, res) => {
        try {
            const userId = req.user.userId;

            const stats = await pool.query(
                `SELECT 
                    (SELECT COUNT(*) FROM connections WHERE user1_id = $1 OR user2_id = $1) as total_connections,
                    (SELECT COUNT(*) FROM connection_requests WHERE receiver_id = $1 AND status = 'pending') as pending_requests,
                    (SELECT COUNT(*) FROM connection_requests WHERE sender_id = $1 AND status = 'pending') as sent_requests`,
                [userId]
            );

            res.status(200).json({
                success: true,
                data: stats.rows[0]
            });

        } catch (error) {
            console.error("Get connection stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch connection stats"
            });
        }
    }
};

export default connectionController;