// src/controllers/messageController.js
import pool from "../config/db.js";

const messageController = {
    // ==================== CONVERSATIONS ====================

    // Get all conversations for a user
    getUserConversations: async (req, res) => {
        try {
            const { user_id } = req.query;
            const { archived = 'false' } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const showArchived = archived === 'true';

            // Get conversations where user is either user1 or user2
            const result = await pool.query(`
                SELECT 
                    conversation_id,
                    CASE 
                        WHEN user1_id = $1 THEN other_user_id_for_user1
                        ELSE other_user_id_for_user2
                    END as other_user_id,
                    CASE 
                        WHEN user1_id = $1 THEN other_user_name_for_user1
                        ELSE other_user_name_for_user2
                    END as other_user_name,
                    CASE 
                        WHEN user1_id = $1 THEN other_user_picture_for_user1
                        ELSE other_user_picture_for_user2
                    END as other_user_picture,
                    CASE 
                        WHEN user1_id = $1 THEN unread_count_for_user1
                        ELSE unread_count_for_user2
                    END as unread_count,
                    CASE 
                        WHEN user1_id = $1 THEN is_archived_by_user1
                        ELSE is_archived_by_user2
                    END as is_archived,
                    CASE 
                        WHEN user1_id = $1 THEN is_blocked_by_user1
                        ELSE is_blocked_by_user2
                    END as is_blocked,
                    last_message_at,
                    last_message_preview,
                    conversation_created_at
                FROM v_user_conversations
                WHERE (user1_id = $1 OR user2_id = $1)
                AND (
                    CASE 
                        WHEN user1_id = $1 THEN is_archived_by_user1 = $2
                        ELSE is_archived_by_user2 = $2
                    END
                )
                ORDER BY last_message_at DESC NULLS LAST
            `, [user_id, showArchived]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get conversations error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch conversations"
            });
        }
    },

    // Get or create conversation between two users
    getOrCreateConversation: async (req, res) => {
        try {
            const { user1_id, user2_id } = req.body;

            if (!user1_id || !user2_id) {
                return res.status(400).json({
                    success: false,
                    error: "Both user IDs are required"
                });
            }

            if (user1_id === user2_id) {
                return res.status(400).json({
                    success: false,
                    error: "Cannot create conversation with yourself"
                });
            }

            // Ensure user1_id < user2_id for consistency
            const [smallerId, largerId] = user1_id < user2_id 
                ? [user1_id, user2_id]
                : [user2_id, user1_id];

            // Try to get existing conversation
            let result = await pool.query(
                `SELECT 
                    c.*,
                    u1.first_name || ' ' || u1.last_name as user1_name,
                    u1.profile_picture as user1_picture,
                    u2.first_name || ' ' || u2.last_name as user2_name,
                    u2.profile_picture as user2_picture
                FROM conversations c
                JOIN users u1 ON c.user1_id = u1.id
                JOIN users u2 ON c.user2_id = u2.id
                WHERE user1_id = $1 AND user2_id = $2`,
                [smallerId, largerId]
            );

            // If doesn't exist, create it
            if (result.rows.length === 0) {
                result = await pool.query(
                    `INSERT INTO conversations (user1_id, user2_id)
                     VALUES ($1, $2)
                     RETURNING *`,
                    [smallerId, largerId]
                );

                // Get user details
                const userDetails = await pool.query(
                    `SELECT 
                        u1.first_name || ' ' || u1.last_name as user1_name,
                        u1.profile_picture as user1_picture,
                        u2.first_name || ' ' || u2.last_name as user2_name,
                        u2.profile_picture as user2_picture
                    FROM users u1, users u2
                    WHERE u1.id = $1 AND u2.id = $2`,
                    [smallerId, largerId]
                );

                result.rows[0] = {
                    ...result.rows[0],
                    ...userDetails.rows[0]
                };
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get/create conversation error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get or create conversation"
            });
        }
    },

    // Get single conversation details
    getConversationById: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(`
                SELECT 
                    c.*,
                    u1.first_name || ' ' || u1.last_name as user1_name,
                    u1.profile_picture as user1_picture,
                    u1.email as user1_email,
                    u2.first_name || ' ' || u2.last_name as user2_name,
                    u2.profile_picture as user2_picture,
                    u2.email as user2_email
                FROM conversations c
                JOIN users u1 ON c.user1_id = u1.id
                JOIN users u2 ON c.user2_id = u2.id
                WHERE c.id = $1 AND (c.user1_id = $2 OR c.user2_id = $2)
            `, [id, user_id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found or you don't have access"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get conversation error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch conversation"
            });
        }
    },

    // Archive conversation
    archiveConversation: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if user is part of conversation
            const convCheck = await pool.query(
                "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
                [id]
            );

            if (convCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found"
                });
            }

            const conv = convCheck.rows[0];
            const isUser1 = conv.user1_id === parseInt(user_id);
            const isUser2 = conv.user2_id === parseInt(user_id);

            if (!isUser1 && !isUser2) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this conversation"
                });
            }

            // Archive for the appropriate user
            const archiveField = isUser1 ? 'is_archived_by_user1' : 'is_archived_by_user2';

            await pool.query(
                `UPDATE conversations SET ${archiveField} = true WHERE id = $1`,
                [id]
            );

            res.status(200).json({
                success: true,
                message: "Conversation archived successfully"
            });

        } catch (error) {
            console.error("Archive conversation error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to archive conversation"
            });
        }
    },

    // Unarchive conversation
    unarchiveConversation: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if user is part of conversation
            const convCheck = await pool.query(
                "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
                [id]
            );

            if (convCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found"
                });
            }

            const conv = convCheck.rows[0];
            const isUser1 = conv.user1_id === parseInt(user_id);
            const isUser2 = conv.user2_id === parseInt(user_id);

            if (!isUser1 && !isUser2) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this conversation"
                });
            }

            // Unarchive for the appropriate user
            const archiveField = isUser1 ? 'is_archived_by_user1' : 'is_archived_by_user2';

            await pool.query(
                `UPDATE conversations SET ${archiveField} = false WHERE id = $1`,
                [id]
            );

            res.status(200).json({
                success: true,
                message: "Conversation unarchived successfully"
            });

        } catch (error) {
            console.error("Unarchive conversation error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unarchive conversation"
            });
        }
    },

    // Block conversation
    blockConversation: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if user is part of conversation
            const convCheck = await pool.query(
                "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
                [id]
            );

            if (convCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found"
                });
            }

            const conv = convCheck.rows[0];
            const isUser1 = conv.user1_id === parseInt(user_id);
            const isUser2 = conv.user2_id === parseInt(user_id);

            if (!isUser1 && !isUser2) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this conversation"
                });
            }

            // Block for the appropriate user
            const blockField = isUser1 ? 'is_blocked_by_user1' : 'is_blocked_by_user2';

            await pool.query(
                `UPDATE conversations SET ${blockField} = true WHERE id = $1`,
                [id]
            );

            res.status(200).json({
                success: true,
                message: "User blocked successfully"
            });

        } catch (error) {
            console.error("Block conversation error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to block user"
            });
        }
    },

    // Unblock conversation
    unblockConversation: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if user is part of conversation
            const convCheck = await pool.query(
                "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
                [id]
            );

            if (convCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found"
                });
            }

            const conv = convCheck.rows[0];
            const isUser1 = conv.user1_id === parseInt(user_id);
            const isUser2 = conv.user2_id === parseInt(user_id);

            if (!isUser1 && !isUser2) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this conversation"
                });
            }

            // Unblock for the appropriate user
            const blockField = isUser1 ? 'is_blocked_by_user1' : 'is_blocked_by_user2';

            await pool.query(
                `UPDATE conversations SET ${blockField} = false WHERE id = $1`,
                [id]
            );

            res.status(200).json({
                success: true,
                message: "User unblocked successfully"
            });

        } catch (error) {
            console.error("Unblock conversation error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unblock user"
            });
        }
    },

    // Delete conversation (for current user)
    deleteConversation: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if user is part of conversation
            const convCheck = await pool.query(
                "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
                [id]
            );

            if (convCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found"
                });
            }

            const conv = convCheck.rows[0];
            const isUser1 = conv.user1_id === parseInt(user_id);
            const isUser2 = conv.user2_id === parseInt(user_id);

            if (!isUser1 && !isUser2) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this conversation"
                });
            }

            // Mark all messages as deleted for this user
            if (isUser1) {
                await pool.query(
                    `UPDATE messages 
                     SET is_deleted_by_sender = CASE WHEN sender_id = $2 THEN true ELSE is_deleted_by_sender END,
                         is_deleted_by_receiver = CASE WHEN sender_id != $2 THEN true ELSE is_deleted_by_receiver END
                     WHERE conversation_id = $1`,
                    [id, user_id]
                );
            } else {
                await pool.query(
                    `UPDATE messages 
                     SET is_deleted_by_sender = CASE WHEN sender_id = $2 THEN true ELSE is_deleted_by_sender END,
                         is_deleted_by_receiver = CASE WHEN sender_id != $2 THEN true ELSE is_deleted_by_receiver END
                     WHERE conversation_id = $1`,
                    [id, user_id]
                );
            }

            res.status(200).json({
                success: true,
                message: "Conversation deleted successfully"
            });

        } catch (error) {
            console.error("Delete conversation error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete conversation"
            });
        }
    },

    // ==================== MESSAGES ====================

    // Get messages in a conversation
    getConversationMessages: async (req, res) => {
        try {
            const { conversation_id } = req.params;
            const { user_id, page = 1, limit = 50 } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Verify user has access to conversation
            const convCheck = await pool.query(
                "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
                [conversation_id]
            );

            if (convCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found"
                });
            }

            const conv = convCheck.rows[0];
            if (conv.user1_id !== parseInt(user_id) && conv.user2_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this conversation"
                });
            }

            // Determine if user is sender or receiver
            const isUser1 = conv.user1_id === parseInt(user_id);

            // Get messages
            const offset = (page - 1) * limit;

            const result = await pool.query(`
                SELECT 
                    m.*,
                    u.first_name || ' ' || u.last_name as sender_name,
                    u.profile_picture as sender_picture,
                    (
                        SELECT json_agg(json_build_object(
                            'id', mr.id,
                            'user_id', mr.user_id,
                            'reaction_type', mr.reaction_type,
                            'created_at', mr.created_at
                        ))
                        FROM message_reactions mr
                        WHERE mr.message_id = m.id
                    ) as reactions
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = $1
                AND (
                    (m.sender_id = $2 AND m.is_deleted_by_sender = false) OR
                    (m.sender_id != $2 AND m.is_deleted_by_receiver = false)
                )
                ORDER BY m.created_at DESC
                LIMIT $3 OFFSET $4
            `, [conversation_id, user_id, limit, offset]);

            // Get total count
            const countResult = await pool.query(`
                SELECT COUNT(*) as total
                FROM messages
                WHERE conversation_id = $1
                AND (
                    (sender_id = $2 AND is_deleted_by_sender = false) OR
                    (sender_id != $2 AND is_deleted_by_receiver = false)
                )
            `, [conversation_id, user_id]);

            const total = parseInt(countResult.rows[0].total);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: total,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(total / limit)
                },
                data: result.rows.reverse() // Reverse to show oldest first
            });

        } catch (error) {
            console.error("Get messages error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch messages"
            });
        }
    },

    // Send message
    sendMessage: async (req, res) => {
        try {
            const { 
                conversation_id, 
                sender_id, 
                message_text,
                attachment_url,
                attachment_type,
                attachment_name,
                attachment_size
            } = req.body;

            if (!conversation_id || !sender_id || !message_text) {
                return res.status(400).json({
                    success: false,
                    error: "Conversation ID, sender ID, and message text are required"
                });
            }

            // Verify sender has access to conversation
            const convCheck = await pool.query(
                "SELECT user1_id, user2_id FROM conversations WHERE id = $1",
                [conversation_id]
            );

            if (convCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found"
                });
            }

            const conv = convCheck.rows[0];
            if (conv.user1_id !== parseInt(sender_id) && conv.user2_id !== parseInt(sender_id)) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this conversation"
                });
            }

            // Check if conversation is blocked
            const isUser1 = conv.user1_id === parseInt(sender_id);
            const blockCheckField = isUser1 ? 'is_blocked_by_user2' : 'is_blocked_by_user1';

            const blockCheck = await pool.query(
                `SELECT ${blockCheckField} as is_blocked FROM conversations WHERE id = $1`,
                [conversation_id]
            );

            if (blockCheck.rows[0].is_blocked) {
                return res.status(403).json({
                    success: false,
                    error: "Cannot send message. You have been blocked by this user."
                });
            }

            // Insert message
            const result = await pool.query(
                `INSERT INTO messages (
                    conversation_id, sender_id, message_text, 
                    attachment_url, attachment_type, attachment_name, attachment_size
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    conversation_id, 
                    sender_id, 
                    message_text,
                    attachment_url || null,
                    attachment_type || null,
                    attachment_name || null,
                    attachment_size || null
                ]
            );

            // Get sender details
            const senderDetails = await pool.query(
                `SELECT first_name || ' ' || last_name as sender_name, profile_picture as sender_picture
                 FROM users WHERE id = $1`,
                [sender_id]
            );

            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                data: {
                    ...result.rows[0],
                    ...senderDetails.rows[0],
                    reactions: []
                }
            });

        } catch (error) {
            console.error("Send message error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to send message"
            });
        }
    },

    // Edit message
    editMessage: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, message_text } = req.body;

            if (!user_id || !message_text) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and message text are required"
                });
            }

            // Check if message exists and user is the sender
            const messageCheck = await pool.query(
                "SELECT sender_id FROM messages WHERE id = $1",
                [id]
            );

            if (messageCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            if (messageCheck.rows[0].sender_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    error: "You can only edit your own messages"
                });
            }

            const result = await pool.query(
                `UPDATE messages 
                 SET message_text = $1, is_edited = true
                 WHERE id = $2
                 RETURNING *`,
                [message_text, id]
            );

            res.status(200).json({
                success: true,
                message: "Message edited successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Edit message error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to edit message"
            });
        }
    },

    // Delete message
    deleteMessage: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if message exists
            const messageCheck = await pool.query(
                "SELECT sender_id, conversation_id FROM messages WHERE id = $1",
                [id]
            );

            if (messageCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            const message = messageCheck.rows[0];
            const isSender = message.sender_id === parseInt(user_id);

            // Soft delete
            if (isSender) {
                await pool.query(
                    "UPDATE messages SET is_deleted_by_sender = true WHERE id = $1",
                    [id]
                );
            } else {
                await pool.query(
                    "UPDATE messages SET is_deleted_by_receiver = true WHERE id = $1",
                    [id]
                );
            }

            // Check if both deleted, then hard delete
            const deletedCheck = await pool.query(
                `SELECT is_deleted_by_sender, is_deleted_by_receiver 
                 FROM messages WHERE id = $1`,
                [id]
            );

            if (deletedCheck.rows[0].is_deleted_by_sender && 
                deletedCheck.rows[0].is_deleted_by_receiver) {
                await pool.query("DELETE FROM messages WHERE id = $1", [id]);
            }

            res.status(200).json({
                success: true,
                message: "Message deleted successfully"
            });

        } catch (error) {
            console.error("Delete message error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete message"
            });
        }
    },

    // Mark messages as read
    markMessagesAsRead: async (req, res) => {
        try {
            const { conversation_id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Mark all unread messages from the other user as read
            await pool.query(
                `UPDATE messages 
                 SET is_read = true, read_at = CURRENT_TIMESTAMP
                 WHERE conversation_id = $1 
                 AND sender_id != $2 
                 AND is_read = false`,
                [conversation_id, user_id]
            );

            res.status(200).json({
                success: true,
                message: "Messages marked as read"
            });

        } catch (error) {
            console.error("Mark as read error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to mark messages as read"
            });
        }
    },

    // ==================== MESSAGE REACTIONS ====================

    // Add reaction to message
    addReaction: async (req, res) => {
        try {
            const { message_id } = req.params;
            const { user_id, reaction_type } = req.body;

            if (!user_id || !reaction_type) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and reaction type are required"
                });
            }

            const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
            if (!validReactions.includes(reaction_type)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid reaction type"
                });
            }

            // Check if message exists
            const messageCheck = await pool.query(
                "SELECT id FROM messages WHERE id = $1",
                [message_id]
            );

            if (messageCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Message not found"
                });
            }

            const result = await pool.query(
                `INSERT INTO message_reactions (message_id, user_id, reaction_type)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (message_id, user_id) 
                 DO UPDATE SET reaction_type = $3
                 RETURNING *`,
                [message_id, user_id, reaction_type]
            );

            res.status(201).json({
                success: true,
                message: "Reaction added successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Add reaction error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to add reaction"
            });
        }
    },

    // Remove reaction from message
    removeReaction: async (req, res) => {
        try {
            const { message_id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 RETURNING *",
                [message_id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Reaction not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Reaction removed successfully"
            });

        } catch (error) {
            console.error("Remove reaction error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to remove reaction"
            });
        }
    },

    // ==================== TYPING INDICATORS ====================

    // Set typing indicator
    setTypingIndicator: async (req, res) => {
        try {
            const { conversation_id, user_id } = req.body;

            if (!conversation_id || !user_id) {
                return res.status(400).json({
                    success: false,
                    error: "Conversation ID and user ID are required"
                });
            }

            await pool.query(
                `INSERT INTO typing_indicators (conversation_id, user_id, expires_at)
                 VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '10 seconds')
                 ON CONFLICT (conversation_id, user_id)
                 DO UPDATE SET 
                    started_at = CURRENT_TIMESTAMP,
                    expires_at = CURRENT_TIMESTAMP + INTERVAL '10 seconds'`,
                [conversation_id, user_id]
            );

            res.status(200).json({
                success: true,
                message: "Typing indicator set"
            });

        } catch (error) {
            console.error("Set typing indicator error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to set typing indicator"
            });
        }
    },

    // Get typing status for conversation
    getTypingStatus: async (req, res) => {
        try {
            const { conversation_id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Get other user's typing status
            const result = await pool.query(
                `SELECT ti.*, u.first_name || ' ' || u.last_name as user_name
                 FROM typing_indicators ti
                 JOIN users u ON ti.user_id = u.id
                 WHERE ti.conversation_id = $1 
                 AND ti.user_id != $2 
                 AND ti.expires_at > CURRENT_TIMESTAMP`,
                [conversation_id, user_id]
            );

            res.status(200).json({
                success: true,
                is_typing: result.rows.length > 0,
                data: result.rows.length > 0 ? result.rows[0] : null
            });

        } catch (error) {
            console.error("Get typing status error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get typing status"
            });
        }
    },

    // ==================== STATISTICS ====================

    // Get messaging statistics
    getMessagingStats: async (req, res) => {
        try {
            const { user_id } = req.query;

            if (user_id) {
                // Get stats for specific user
                const stats = await pool.query(`
                    SELECT 
                        COUNT(DISTINCT c.id) as total_conversations,
                        COUNT(DISTINCT CASE WHEN m.sender_id = $1 THEN m.id END) as messages_sent,
                        COUNT(DISTINCT CASE WHEN m.sender_id != $1 THEN m.id END) as messages_received,
                        COUNT(DISTINCT CASE WHEN m.sender_id != $1 AND m.is_read = false THEN m.id END) as unread_messages
                    FROM conversations c
                    LEFT JOIN messages m ON c.id = m.conversation_id
                    WHERE (c.user1_id = $1 OR c.user2_id = $1)
                `, [user_id]);

                res.status(200).json({
                    success: true,
                    data: stats.rows[0]
                });
            } else {
                // Get overall stats
                const result = await pool.query("SELECT * FROM v_message_stats");

                res.status(200).json({
                    success: true,
                    data: result.rows[0]
                });
            }

        } catch (error) {
            console.error("Get stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch statistics"
            });
        }
    },

    
    getUnreadMessageCount: async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT COUNT(DISTINCT m.conversation_id) as unread_conversations
             FROM messages m
             JOIN conversations c ON m.conversation_id = c.id
             WHERE (c.user1_id = $1 OR c.user2_id = $1)
             AND m.sender_id != $1
             AND m.is_read = false`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                unread_count: parseInt(result.rows[0].unread_conversations)
            }
        });
    } catch (error) {
        console.error('Get unread message count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get unread message count'
        });
    }
}
};


// src/controllers/messageController.js - Add this method



export default messageController;