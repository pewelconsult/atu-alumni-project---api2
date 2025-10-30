// src/models/NewsLike.js
import pool from "../config/db.js";

const NewsLikeModel = {
    // Create news_likes table
    createTable: async () => {
        const query = `
            -- Create news_likes table
            CREATE TABLE IF NOT EXISTS news_likes (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                news_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamp
                liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(news_id, user_id)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_news_likes_news_id ON news_likes(news_id);
            CREATE INDEX IF NOT EXISTS idx_news_likes_user_id ON news_likes(user_id);

            -- Create trigger to increment article likes_count
            CREATE OR REPLACE FUNCTION increment_news_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE news_articles 
                SET likes_count = likes_count + 1 
                WHERE id = NEW.news_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_news_likes ON news_likes;
            CREATE TRIGGER trigger_increment_news_likes
                AFTER INSERT ON news_likes
                FOR EACH ROW
                EXECUTE FUNCTION increment_news_likes_count();

            -- Create trigger to decrement article likes_count
            CREATE OR REPLACE FUNCTION decrement_news_likes_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE news_articles 
                SET likes_count = likes_count - 1 
                WHERE id = OLD.news_id;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_news_likes ON news_likes;
            CREATE TRIGGER trigger_decrement_news_likes
                AFTER DELETE ON news_likes
                FOR EACH ROW
                EXECUTE FUNCTION decrement_news_likes_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ News Likes table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating news_likes table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS news_likes CASCADE;");
            console.log("✅ News Likes table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping news_likes table:", error);
            throw error;
        }
    }
};

export default NewsLikeModel;