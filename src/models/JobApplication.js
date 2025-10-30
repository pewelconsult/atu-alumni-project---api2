// src/models/JobApplication.js
import pool from "../config/db.js";

const JobApplicationModel = {
    // Create job_applications table
    createTable: async () => {
        const query = `
            -- Create job_applications table
            CREATE TABLE IF NOT EXISTS job_applications (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Application Details
                cover_letter TEXT,
                resume_url VARCHAR(500),
                
                -- Status Tracking
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted', 'withdrawn')),
                
                -- Admin Notes
                notes TEXT,
                reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                reviewed_at TIMESTAMP,
                
                -- Timestamps
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(job_id, user_id)  -- One application per user per job
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
            CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
            CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
            CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
            CREATE TRIGGER update_job_applications_updated_at
                BEFORE UPDATE ON job_applications
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create trigger to update jobs.applications_count when application is created
            CREATE OR REPLACE FUNCTION increment_job_applications_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE jobs 
                SET applications_count = applications_count + 1 
                WHERE id = NEW.job_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_applications ON job_applications;
            CREATE TRIGGER trigger_increment_applications
                AFTER INSERT ON job_applications
                FOR EACH ROW
                EXECUTE FUNCTION increment_job_applications_count();

            -- Create trigger to decrement applications_count when application is deleted
            CREATE OR REPLACE FUNCTION decrement_job_applications_count()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE jobs 
                SET applications_count = applications_count - 1 
                WHERE id = OLD.job_id;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_applications ON job_applications;
            CREATE TRIGGER trigger_decrement_applications
                AFTER DELETE ON job_applications
                FOR EACH ROW
                EXECUTE FUNCTION decrement_job_applications_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ Job Applications table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating job_applications table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS job_applications CASCADE;");
            console.log("✅ Job Applications table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping job_applications table:", error);
            throw error;
        }
    }
};

export default JobApplicationModel;