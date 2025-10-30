// src/models/EventComment.js
import pool from "../config/db.js";

const EventCommentModel = {
    // Create event_comments table
    createTable: async () => {
        const query = `
            -- Create event_comments table
            CREATE TABLE IF NOT EXISTS event_comments (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                parent_comment_id INTEGER REFERENCES event_comments(id) ON DELETE CASCADE,
                
                -- Comment Details
                comment TEXT NOT NULL,
                
                -- Metrics
                likes_count INTEGER DEFAULT 0,
                
                -- Status
                is_edited BOOLEAN DEFAULT FALSE,
                is_deleted BOOLEAN DEFAULT FALSE,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CHECK (char_length(comment) >= 1 AND char_length(comment) <= 2000)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
            CREATE INDEX IF NOT EXISTS idx_event_comments_user_id ON event_comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_event_comments_parent_comment_id ON event_comments(parent_comment_id);
            CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON event_comments(created_at);
            CREATE INDEX IF NOT EXISTS idx_event_comments_is_deleted ON event_comments(is_deleted);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_event_comments_updated_at ON event_comments;
            CREATE TRIGGER update_event_comments_updated_at
                BEFORE UPDATE ON event_comments
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create trigger to set is_edited flag when comment is updated
            CREATE OR REPLACE FUNCTION mark_comment_as_edited()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.comment != NEW.comment THEN
                    NEW.is_edited = TRUE;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_mark_comment_edited ON event_comments;
            CREATE TRIGGER trigger_mark_comment_edited
                BEFORE UPDATE ON event_comments
                FOR EACH ROW
                EXECUTE FUNCTION mark_comment_as_edited();
        `;

        try {
            await pool.query(query);
            console.log("✅ Event Comments table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating event_comments table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS event_comments CASCADE;");
            console.log("✅ Event Comments table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping event_comments table:", error);
            throw error;
        }
    }
};

export default EventCommentModel;