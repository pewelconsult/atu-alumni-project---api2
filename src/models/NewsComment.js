// src/models/NewsComment.js
import pool from "../config/db.js";

const NewsCommentModel = {
    // Create news_comments table
    createTable: async () => {
        const query = `
            -- Create news_comments table
            CREATE TABLE IF NOT EXISTS news_comments (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                news_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Comment Content
                comment TEXT NOT NULL,
                
                -- Status
                is_edited BOOLEAN DEFAULT FALSE,
                is_deleted BOOLEAN DEFAULT FALSE,
                
                -- Metrics
                likes_count INTEGER DEFAULT 0,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CHECK (char_length(comment) >= 1 AND char_length(comment) <= 2000)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON news_comments(news_id);
            CREATE INDEX IF NOT EXISTS idx_news_comments_user_id ON news_comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_news_comments_is_deleted ON news_comments(is_deleted);
            CREATE INDEX IF NOT EXISTS idx_news_comments_created_at ON news_comments(created_at);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_news_comments_updated_at ON news_comments;
            CREATE TRIGGER update_news_comments_updated_at
                BEFORE UPDATE ON news_comments
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create trigger to mark comment as edited
            CREATE OR REPLACE FUNCTION mark_news_comment_as_edited()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.comment != NEW.comment AND OLD.is_deleted = FALSE THEN
                    NEW.is_edited = TRUE;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_mark_news_comment_edited ON news_comments;
            CREATE TRIGGER trigger_mark_news_comment_edited
                BEFORE UPDATE ON news_comments
                FOR EACH ROW
                EXECUTE FUNCTION mark_news_comment_as_edited();

            -- Create trigger to increment article comments_count
            CREATE OR REPLACE FUNCTION increment_news_comments_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE news_articles 
                SET comments_count = comments_count + 1 
                WHERE id = NEW.news_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_news_comments ON news_comments;
            CREATE TRIGGER trigger_increment_news_comments
                AFTER INSERT ON news_comments
                FOR EACH ROW
                EXECUTE FUNCTION increment_news_comments_count();

            -- Create trigger to decrement article comments_count
            CREATE OR REPLACE FUNCTION decrement_news_comments_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.is_deleted = FALSE THEN
                    UPDATE news_articles 
                    SET comments_count = comments_count - 1 
                    WHERE id = OLD.news_id;
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_news_comments ON news_comments;
            CREATE TRIGGER trigger_decrement_news_comments
                AFTER DELETE ON news_comments
                FOR EACH ROW
                EXECUTE FUNCTION decrement_news_comments_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ News Comments table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating news_comments table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS news_comments CASCADE;");
            console.log("✅ News Comments table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping news_comments table:", error);
            throw error;
        }
    }
};

export default NewsCommentModel;