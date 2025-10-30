// src/models/ForumReply.js
import pool from "../config/db.js";

const ForumReplyModel = {
    // Create forum_replies table
    createTable: async () => {
        const query = `
            -- Create forum_replies table
            CREATE TABLE IF NOT EXISTS forum_replies (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                parent_reply_id INTEGER REFERENCES forum_replies(id) ON DELETE CASCADE,
                
                -- Reply Content
                content TEXT NOT NULL,
                
                -- Status
                is_solution BOOLEAN DEFAULT FALSE,
                is_edited BOOLEAN DEFAULT FALSE,
                is_deleted BOOLEAN DEFAULT FALSE,
                
                -- Metrics
                likes_count INTEGER DEFAULT 0,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CHECK (char_length(content) >= 1 AND char_length(content) <= 10000)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
            CREATE INDEX IF NOT EXISTS idx_forum_replies_user_id ON forum_replies(user_id);
            CREATE INDEX IF NOT EXISTS idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id);
            CREATE INDEX IF NOT EXISTS idx_forum_replies_is_solution ON forum_replies(is_solution);
            CREATE INDEX IF NOT EXISTS idx_forum_replies_is_deleted ON forum_replies(is_deleted);
            CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_forum_replies_updated_at ON forum_replies;
            CREATE TRIGGER update_forum_replies_updated_at
                BEFORE UPDATE ON forum_replies
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create trigger to mark reply as edited when content changes
            CREATE OR REPLACE FUNCTION mark_reply_as_edited()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.content != NEW.content AND OLD.is_deleted = FALSE THEN
                    NEW.is_edited = TRUE;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_mark_reply_edited ON forum_replies;
            CREATE TRIGGER trigger_mark_reply_edited
                BEFORE UPDATE ON forum_replies
                FOR EACH ROW
                EXECUTE FUNCTION mark_reply_as_edited();

            -- Create trigger to increment post replies_count and update last_activity_at
            CREATE OR REPLACE FUNCTION increment_post_replies_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE forum_posts 
                SET replies_count = replies_count + 1,
                    last_activity_at = CURRENT_TIMESTAMP
                WHERE id = NEW.post_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_post_replies ON forum_replies;
            CREATE TRIGGER trigger_increment_post_replies
                AFTER INSERT ON forum_replies
                FOR EACH ROW
                EXECUTE FUNCTION increment_post_replies_count();

            -- Create trigger to decrement post replies_count
            CREATE OR REPLACE FUNCTION decrement_post_replies_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.is_deleted = FALSE THEN
                    UPDATE forum_posts 
                    SET replies_count = replies_count - 1 
                    WHERE id = OLD.post_id;
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_post_replies ON forum_replies;
            CREATE TRIGGER trigger_decrement_post_replies
                AFTER DELETE ON forum_replies
                FOR EACH ROW
                EXECUTE FUNCTION decrement_post_replies_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ Forum Replies table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating forum_replies table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS forum_replies CASCADE;");
            console.log("✅ Forum Replies table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping forum_replies table:", error);
            throw error;
        }
    }
};

export default ForumReplyModel;