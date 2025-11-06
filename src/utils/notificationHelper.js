import pool from '../config/db.js';

// Add this helper function at the top level (outside the class)
export async function createNotification(userId, type, title, message, link = null, metadata = null) {
    try {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, type, title, message, link, JSON.stringify(metadata)]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
}
/**
 * Create bulk notifications
 */
export const createBulkNotifications = async (notifications) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const results = [];
        for (const notif of notifications) {
            const result = await client.query(
                `INSERT INTO notifications (user_id, type, title, message, link, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    notif.userId, 
                    notif.type, 
                    notif.title, 
                    notif.message, 
                    notif.link || null, 
                    notif.metadata ? JSON.stringify(notif.metadata) : null
                ]
            );
            results.push(result.rows[0]);
        }
        
        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create bulk notifications error:', error);
        throw error;
    } finally {
        client.release();
    }
};

export default {
    createNotification,
    createBulkNotifications
};