// src/models/ForumCategory.js
import pool from "../config/db.js";

const ForumCategoryModel = {
    // Create forum_categories table
    createTable: async () => {
        const query = `
            -- Create forum_categories table
            CREATE TABLE IF NOT EXISTS forum_categories (
                id SERIAL PRIMARY KEY,
                
                -- Category Info
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT NOT NULL,
                icon VARCHAR(50),
                color VARCHAR(20),
                
                -- Display & Status
                order_position INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Metrics
                posts_count INTEGER DEFAULT 0,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_forum_categories_slug ON forum_categories(slug);
            CREATE INDEX IF NOT EXISTS idx_forum_categories_is_active ON forum_categories(is_active);
            CREATE INDEX IF NOT EXISTS idx_forum_categories_order_position ON forum_categories(order_position);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_forum_categories_updated_at ON forum_categories;
            CREATE TRIGGER update_forum_categories_updated_at
                BEFORE UPDATE ON forum_categories
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `;

        try {
            await pool.query(query);
            console.log("✅ Forum Categories table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating forum_categories table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS forum_categories CASCADE;");
            console.log("✅ Forum Categories table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping forum_categories table:", error);
            throw error;
        }
    }
};

export default ForumCategoryModel;