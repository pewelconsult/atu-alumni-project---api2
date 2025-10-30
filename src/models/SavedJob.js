// src/models/SavedJob.js
import pool from "../config/db.js";

const SavedJobModel = {
    // Create saved_jobs table
    createTable: async () => {
        const query = `
            -- Create saved_jobs table
            CREATE TABLE IF NOT EXISTS saved_jobs (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamp
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(job_id, user_id)  -- Can't save same job twice
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
            CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
            CREATE INDEX IF NOT EXISTS idx_saved_jobs_saved_at ON saved_jobs(saved_at);
        `;

        try {
            await pool.query(query);
            console.log("✅ Saved Jobs table created successfully with all indexes!");
            return true;
        } catch (error) {
            console.error("❌ Error creating saved_jobs table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS saved_jobs CASCADE;");
            console.log("✅ Saved Jobs table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping saved_jobs table:", error);
            throw error;
        }
    }
};

export default SavedJobModel;