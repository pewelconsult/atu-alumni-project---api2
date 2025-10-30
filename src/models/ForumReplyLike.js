// src/models/ForumReplyLike.js
import pool from "../config/db.js";

const ForumReplyLikeModel = {
    // Create forum_reply_likes table
    createTable: async () => {
        const query = `
            -- Create forum_reply_likes table
            CREATE TABLE IF NOT EXISTS forum_reply_likes (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                reply_id INTEGER NOT NULL REFERENCES forum_replies(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamp
                liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(reply_id, user_id)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_reply_id ON forum_reply_likes(reply_id);
            CREATE INDEX IF NOT EXISTS idx_forum_reply_likes_user_id ON forum_reply_likes(user_id);

            -- Create trigger to increment reply likes_count
            CREATE OR REPLACE FUNCTION increment_reply_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE forum_replies 
                SET likes_count = likes_count + 1 
                WHERE id = NEW.reply_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_reply_likes ON forum_reply_likes;
            CREATE TRIGGER trigger_increment_reply_likes
                AFTER INSERT ON forum_reply_likes
                FOR EACH ROW
                EXECUTE FUNCTION increment_reply_likes_count();

            -- Create trigger to decrement reply likes_count
            CREATE OR REPLACE FUNCTION decrement_reply_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE forum_replies 
                SET likes_count = likes_count - 1 
                WHERE id = OLD.reply_id;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_reply_likes ON forum_reply_likes;
            CREATE TRIGGER trigger_decrement_reply_likes
                AFTER DELETE ON forum_reply_likes
                FOR EACH ROW
                EXECUTE FUNCTION decrement_reply_likes_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ Forum Reply Likes table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating forum_reply_likes table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS forum_reply_likes CASCADE;");
            console.log("✅ Forum Reply Likes table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping forum_reply_likes table:", error);
            throw error;
        }
    }
};

export default ForumReplyLikeModel;