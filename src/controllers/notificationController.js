// src/controllers/notificationController.js
import pool from "../config/db.js";

/**
 * Helper function to create notification (exported for use in other services)
 */
export async function createNotification(userId, type, title, message, link = null, metadata = null) {
    try {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link, metadata, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, false)
             RETURNING *`,
            [userId, type, title, message, link, metadata ? JSON.stringify(metadata) : null]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
}

/**
 * Get all notifications for current user
 */
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM notifications 
            WHERE user_id = $1
        `;
        const params = [userId];

        if (type && type !== 'all' && type !== 'unread') {
            query += ` AND type = $${params.length + 1}`;
            params.push(type);
        }

        if (type === 'unread') {
            query += ` AND is_read = false`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM notifications WHERE user_id = $1`;
        const countParams = [userId];
        
        if (type && type !== 'all' && type !== 'unread') {
            countQuery += ` AND type = $2`;
            countParams.push(type);
        }
        if (type === 'unread') {
            countQuery += ` AND is_read = false`;
        }

        const countResult = await pool.query(countQuery, countParams);

        res.status(200).json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    }
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 AND is_read = false 
             ORDER BY created_at DESC 
             LIMIT 10`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get unread notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch unread notifications'
        });
    }
};

/**
 * Get notification stats
 */
export const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get total unread count
        const unreadResult = await pool.query(
            `SELECT COUNT(*) as total_unread FROM notifications 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        // Get unread count by type
        const typeResult = await pool.query(
            `SELECT type, COUNT(*) as count 
             FROM notifications 
             WHERE user_id = $1 AND is_read = false 
             GROUP BY type`,
            [userId]
        );

        const unreadByType = {
            connection_request: 0,
            connection_accepted: 0,
            event_rsvp: 0,
            event_reminder: 0,
            job_application: 0,
            message: 0,
            forum_reply: 0,
            system: 0
        };

        typeResult.rows.forEach(row => {
            unreadByType[row.type] = parseInt(row.count);
        });

        res.status(200).json({
            success: true,
            data: {
                total_unread: parseInt(unreadResult.rows[0].total_unread),
                unread_by_type: unreadByType
            }
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notification stats'
        });
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = NOW() 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read'
        });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = NOW() 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark all notifications as read'
        });
    }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification'
        });
    }
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE user_id = $1 AND is_read = true
             RETURNING *`,
            [userId]
        );

        res.status(200).json({
            success: true,
            message: `Deleted ${result.rowCount} notifications`
        });
    } catch (error) {
        console.error('Delete all read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notifications'
        });
    }
};