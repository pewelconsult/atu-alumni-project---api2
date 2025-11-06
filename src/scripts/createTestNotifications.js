import pool from '../config/db.js';

async function createTestNotifications() {
    try {
        // Get first user
        const userResult = await pool.query('SELECT id FROM users LIMIT 1');
        
        if (userResult.rows.length === 0) {
            console.log('No users found. Please create a user first.');
            return;
        }

        const userId = userResult.rows[0].id;

        // Create test notifications
        const notifications = [
            {
                user_id: userId,
                type: 'system',
                title: 'Welcome to ATU Alumni Network',
                message: 'Welcome! Start connecting with fellow alumni and exploring opportunities.',
                link: '/dashboard'
            },
            {
                user_id: userId,
                type: 'connection_request',
                title: 'New Connection Request',
                message: 'John Doe wants to connect with you',
                link: '/networks'
            },
            {
                user_id: userId,
                type: 'event_reminder',
                title: 'Event Tomorrow',
                message: 'Alumni Meetup 2025 is tomorrow at 6:00 PM',
                link: '/events'
            }
        ];

        for (const notif of notifications) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, link)
                 VALUES ($1, $2, $3, $4, $5)`,
                [notif.user_id, notif.type, notif.title, notif.message, notif.link]
            );
        }

        console.log('✅ Test notifications created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test notifications:', error);
        process.exit(1);
    }
}

createTestNotifications();