// src/models/ForumSubscription.js
import pool from "../config/db.js";

const ForumSubscriptionModel = {
    // Create forum_subscriptions table
    createTable: async () => {
        const query = `
            -- Create forum_subscriptions table
            CREATE TABLE IF NOT EXISTS forum_subscriptions (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamp
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(post_id, user_id)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_post_id ON forum_subscriptions(post_id);
            CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_user_id ON forum_subscriptions(user_id);
        `;

        try {
            await pool.query(query);
            console.log("✅ Forum Subscriptions table created successfully with all indexes!");
            return true;
        } catch (error) {
            console.error("❌ Error creating forum_subscriptions table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS forum_subscriptions CASCADE;");
            console.log("✅ Forum Subscriptions table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping forum_subscriptions table:", error);
            throw error;
        }
    }
};

export default ForumSubscriptionModel;