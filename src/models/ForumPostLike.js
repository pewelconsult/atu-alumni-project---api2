// src/models/ForumPostLike.js
import pool from "../config/db.js";

const ForumPostLikeModel = {
    // Create forum_post_likes table
    createTable: async () => {
        const query = `
            -- Create forum_post_likes table
            CREATE TABLE IF NOT EXISTS forum_post_likes (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamp
                liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(post_id, user_id)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON forum_post_likes(post_id);
            CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user_id ON forum_post_likes(user_id);

            -- Create trigger to increment post likes_count
            CREATE OR REPLACE FUNCTION increment_post_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE forum_posts 
                SET likes_count = likes_count + 1 
                WHERE id = NEW.post_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_post_likes ON forum_post_likes;
            CREATE TRIGGER trigger_increment_post_likes
                AFTER INSERT ON forum_post_likes
                FOR EACH ROW
                EXECUTE FUNCTION increment_post_likes_count();

            -- Create trigger to decrement post likes_count
            CREATE OR REPLACE FUNCTION decrement_post_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE forum_posts 
                SET likes_count = likes_count - 1 
                WHERE id = OLD.post_id;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_post_likes ON forum_post_likes;
            CREATE TRIGGER trigger_decrement_post_likes
                AFTER DELETE ON forum_post_likes
                FOR EACH ROW
                EXECUTE FUNCTION decrement_post_likes_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ Forum Post Likes table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating forum_post_likes table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS forum_post_likes CASCADE;");
            console.log("✅ Forum Post Likes table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping forum_post_likes table:", error);
            throw error;
        }
    }
};

export default ForumPostLikeModel;