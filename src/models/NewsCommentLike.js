// src/models/NewsCommentLike.js
import pool from "../config/db.js";

const NewsCommentLikeModel = {
    // Create news_comment_likes table
    createTable: async () => {
        const query = `
            -- Create news_comment_likes table
            CREATE TABLE IF NOT EXISTS news_comment_likes (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                comment_id INTEGER NOT NULL REFERENCES news_comments(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamp
                liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(comment_id, user_id)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_news_comment_likes_comment_id ON news_comment_likes(comment_id);
            CREATE INDEX IF NOT EXISTS idx_news_comment_likes_user_id ON news_comment_likes(user_id);

            -- Create trigger to increment comment likes_count
            CREATE OR REPLACE FUNCTION increment_news_comment_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE news_comments 
                SET likes_count = likes_count + 1 
                WHERE id = NEW.comment_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_news_comment_likes ON news_comment_likes;
            CREATE TRIGGER trigger_increment_news_comment_likes
                AFTER INSERT ON news_comment_likes
                FOR EACH ROW
                EXECUTE FUNCTION increment_news_comment_likes_count();

            -- Create trigger to decrement comment likes_count
            CREATE OR REPLACE FUNCTION decrement_news_comment_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE news_comments 
                SET likes_count = likes_count - 1 
                WHERE id = OLD.comment_id;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_news_comment_likes ON news_comment_likes;
            CREATE TRIGGER trigger_decrement_news_comment_likes
                AFTER DELETE ON news_comment_likes
                FOR EACH ROW
                EXECUTE FUNCTION decrement_news_comment_likes_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ News Comment Likes table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating news_comment_likes table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS news_comment_likes CASCADE;");
            console.log("✅ News Comment Likes table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping news_comment_likes table:", error);
            throw error;
        }
    }
};

export default NewsCommentLikeModel;