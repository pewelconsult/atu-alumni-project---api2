// src/models/ForumPost.js
import pool from "../config/db.js";

const ForumPostModel = {
    // Create forum_posts table
    createTable: async () => {
        const query = `
            -- Create forum_posts table
            CREATE TABLE IF NOT EXISTS forum_posts (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Post Content
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                tags TEXT[],
                
                -- Status & Moderation
                is_pinned BOOLEAN DEFAULT FALSE,
                is_locked BOOLEAN DEFAULT FALSE,
                is_published BOOLEAN DEFAULT TRUE,
                
                -- Metrics
                views_count INTEGER DEFAULT 0,
                replies_count INTEGER DEFAULT 0,
                likes_count INTEGER DEFAULT 0,
                
                -- Activity Tracking
                last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CHECK (char_length(title) >= 5 AND char_length(title) <= 255),
                CHECK (char_length(content) >= 10)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id);
            CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
            CREATE INDEX IF NOT EXISTS idx_forum_posts_slug ON forum_posts(slug);
            CREATE INDEX IF NOT EXISTS idx_forum_posts_is_pinned ON forum_posts(is_pinned);
            CREATE INDEX IF NOT EXISTS idx_forum_posts_is_published ON forum_posts(is_published);
            CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);
            CREATE INDEX IF NOT EXISTS idx_forum_posts_last_activity_at ON forum_posts(last_activity_at);
            CREATE INDEX IF NOT EXISTS idx_forum_posts_tags ON forum_posts USING GIN(tags);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
            CREATE TRIGGER update_forum_posts_updated_at
                BEFORE UPDATE ON forum_posts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create trigger to increment category posts_count
            CREATE OR REPLACE FUNCTION increment_category_posts_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE forum_categories 
                SET posts_count = posts_count + 1 
                WHERE id = NEW.category_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_category_posts ON forum_posts;
            CREATE TRIGGER trigger_increment_category_posts
                AFTER INSERT ON forum_posts
                FOR EACH ROW
                EXECUTE FUNCTION increment_category_posts_count();

            -- Create trigger to decrement category posts_count
            CREATE OR REPLACE FUNCTION decrement_category_posts_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE forum_categories 
                SET posts_count = posts_count - 1 
                WHERE id = OLD.category_id;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_category_posts ON forum_posts;
            CREATE TRIGGER trigger_decrement_category_posts
                AFTER DELETE ON forum_posts
                FOR EACH ROW
                EXECUTE FUNCTION decrement_category_posts_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ Forum Posts table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating forum_posts table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS forum_posts CASCADE;");
            console.log("✅ Forum Posts table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping forum_posts table:", error);
            throw error;
        }
    }
};

export default ForumPostModel;