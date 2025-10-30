// src/models/EventCommentLike.js
import pool from "../config/db.js";

const EventCommentLikeModel = {
    // Create event_comment_likes table
    createTable: async () => {
        const query = `
            -- Create event_comment_likes table
            CREATE TABLE IF NOT EXISTS event_comment_likes (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                comment_id INTEGER NOT NULL REFERENCES event_comments(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamp
                liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(comment_id, user_id)  -- One like per user per comment
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_event_comment_likes_comment_id ON event_comment_likes(comment_id);
            CREATE INDEX IF NOT EXISTS idx_event_comment_likes_user_id ON event_comment_likes(user_id);

            -- Create trigger to increment likes_count when like is added
            CREATE OR REPLACE FUNCTION increment_comment_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE event_comments 
                SET likes_count = likes_count + 1 
                WHERE id = NEW.comment_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_comment_likes ON event_comment_likes;
            CREATE TRIGGER trigger_increment_comment_likes
                AFTER INSERT ON event_comment_likes
                FOR EACH ROW
                EXECUTE FUNCTION increment_comment_likes_count();

            -- Create trigger to decrement likes_count when like is removed
            CREATE OR REPLACE FUNCTION decrement_comment_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE event_comments 
                SET likes_count = likes_count - 1 
                WHERE id = OLD.comment_id;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_comment_likes ON event_comment_likes;
            CREATE TRIGGER trigger_decrement_comment_likes
                AFTER DELETE ON event_comment_likes
                FOR EACH ROW
                EXECUTE FUNCTION decrement_comment_likes_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ Event Comment Likes table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating event_comment_likes table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS event_comment_likes CASCADE;");
            console.log("✅ Event Comment Likes table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping event_comment_likes table:", error);
            throw error;
        }
    }
};

export default EventCommentLikeModel;