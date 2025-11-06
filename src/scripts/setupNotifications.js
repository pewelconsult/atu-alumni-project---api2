import NotificationModel from '../models/Notification.js';
import pool from '../config/db.js';

async function setupNotifications() {
    try {
        console.log('🚀 Setting up notifications table...\n');
        
        // Create tables
        await NotificationModel.createTables();
        
        console.log('\n✅ Notifications setup completed successfully!');
        console.log('\nYou can now:');
        console.log('  1. Run test notifications: node src/scripts/createTestNotifications.js');
        console.log('  2. Start the server: npm run dev');
        console.log('  3. View notifications at: http://localhost:4200/notifications\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error setting up notifications:', error);
        process.exit(1);
    }
}

setupNotifications();