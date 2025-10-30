// src/models/Job.js
import pool from "../config/db.js";

const JobModel = {
    // Create jobs table
    createTable: async () => {
        const query = `
            -- Create jobs table
            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                
                -- Posted by (Foreign key to users)
                posted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Company Information
                company_name VARCHAR(255) NOT NULL,
                company_logo VARCHAR(500),
                company_website VARCHAR(500),
                industry VARCHAR(100),
                
                -- Job Details
                job_title VARCHAR(255) NOT NULL,
                job_description TEXT NOT NULL,
                job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary')),
                
                -- Location
                location VARCHAR(255) NOT NULL,
                location_type VARCHAR(50) CHECK (location_type IN ('On-site', 'Remote', 'Hybrid')),
                
                -- Salary Information
                salary_min INTEGER,
                salary_max INTEGER,
                salary_currency VARCHAR(10) DEFAULT 'GHS',
                salary_period VARCHAR(20) CHECK (salary_period IN ('per hour', 'per day', 'per month', 'per year')),
                
                -- Requirements
                experience_level VARCHAR(50) CHECK (experience_level IN ('Entry', 'Mid', 'Senior', 'Executive', 'Internship')),
                education_required VARCHAR(100),
                skills_required TEXT[],
                
                -- Details
                responsibilities TEXT,
                qualifications TEXT,
                benefits TEXT,
                
                -- Application
                application_deadline DATE,
                application_url VARCHAR(500),
                application_email VARCHAR(255),
                positions_available INTEGER DEFAULT 1,
                
                -- Status & Metrics
                is_active BOOLEAN DEFAULT TRUE,
                is_featured BOOLEAN DEFAULT FALSE,
                views_count INTEGER DEFAULT 0,
                applications_count INTEGER DEFAULT 0,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
            CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON jobs(company_name);
            CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
            CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
            CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
            CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
            CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs(is_featured);
            CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
            CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline ON jobs(application_deadline);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
            CREATE TRIGGER update_jobs_updated_at
                BEFORE UPDATE ON jobs
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `;

        try {
            await pool.query(query);
            console.log("✅ Jobs table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating jobs table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS jobs CASCADE;");
            console.log("✅ Jobs table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping jobs table:", error);
            throw error;
        }
    }
};

export default JobModel;