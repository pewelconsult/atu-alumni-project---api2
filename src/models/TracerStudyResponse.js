// src/models/TracerStudyResponse.js
import pool from "../config/db.js";

const TracerStudyResponseModel = {
    // Create tracer_study_responses table
    createTable: async () => {
        const query = `
            -- Create tracer_study_responses table
            CREATE TABLE IF NOT EXISTS tracer_study_responses (
                id SERIAL PRIMARY KEY,
                
                -- User Reference
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Section 1: Personal Information
                full_name VARCHAR(255) NOT NULL,
                index_number VARCHAR(50) NOT NULL,
                programme_of_study VARCHAR(100) NOT NULL,
                year_of_graduation INTEGER NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                
                -- Section 2: Current Status
                current_status VARCHAR(50) NOT NULL CHECK (current_status IN ('Employed', 'Self-employed', 'Unemployed', 'Pursuing further studies')),
                time_to_first_job VARCHAR(50),
                main_challenge VARCHAR(100),
                
                -- Section 3: Employment/Self-Employment (Conditional)
                job_title VARCHAR(255),
                employer_name VARCHAR(255),
                sector VARCHAR(50) CHECK (sector IN ('Public', 'Private', 'NGO', 'Self-employed', 'Other')),
                job_related_to_field VARCHAR(20) CHECK (job_related_to_field IN ('Yes', 'Partly', 'No')),
                monthly_income_range VARCHAR(50),
                how_found_job VARCHAR(100),
                job_level VARCHAR(50) CHECK (job_level IN ('Entry-level', 'Middle-level', 'Senior-level', 'Management / Executive')),
                
                -- Section 4: Skills and Training
                skills_relevance_rating INTEGER CHECK (skills_relevance_rating BETWEEN 1 AND 5),
                skills_to_strengthen TEXT,
                job_satisfaction_rating INTEGER CHECK (job_satisfaction_rating BETWEEN 1 AND 5),
                
                -- Section 5: Feedback on ATU
                programme_quality_rating VARCHAR(50) CHECK (programme_quality_rating IN ('Excellent', 'Good', 'Fair', 'Poor')),
                internship_support_satisfaction VARCHAR(50) CHECK (internship_support_satisfaction IN ('Very satisfied', 'Satisfied', 'Dissatisfied')),
                would_recommend_atu VARCHAR(20) CHECK (would_recommend_atu IN ('Yes', 'Maybe', 'No')),
                
                -- Section 6: Alumni Engagement
                is_alumni_member BOOLEAN DEFAULT FALSE,
                willing_to_mentor BOOLEAN DEFAULT FALSE,
                preferred_contact_method VARCHAR(50),
                willing_to_collaborate BOOLEAN DEFAULT FALSE,
                
                -- Metadata
                is_completed BOOLEAN DEFAULT TRUE,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(user_id),
                CHECK (year_of_graduation >= 2010 AND year_of_graduation <= EXTRACT(YEAR FROM CURRENT_DATE))
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_tracer_study_user_id ON tracer_study_responses(user_id);
            CREATE INDEX IF NOT EXISTS idx_tracer_study_programme ON tracer_study_responses(programme_of_study);
            CREATE INDEX IF NOT EXISTS idx_tracer_study_graduation_year ON tracer_study_responses(year_of_graduation);
            CREATE INDEX IF NOT EXISTS idx_tracer_study_current_status ON tracer_study_responses(current_status);
            CREATE INDEX IF NOT EXISTS idx_tracer_study_sector ON tracer_study_responses(sector);
            CREATE INDEX IF NOT EXISTS idx_tracer_study_is_completed ON tracer_study_responses(is_completed);
            CREATE INDEX IF NOT EXISTS idx_tracer_study_submitted_at ON tracer_study_responses(submitted_at);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_tracer_study_responses_updated_at ON tracer_study_responses;
            CREATE TRIGGER update_tracer_study_responses_updated_at
                BEFORE UPDATE ON tracer_study_responses
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create view for analytics
            CREATE OR REPLACE VIEW tracer_study_analytics AS
            SELECT 
                COUNT(*) as total_responses,
                COUNT(DISTINCT programme_of_study) as total_programmes,
                COUNT(CASE WHEN current_status = 'Employed' THEN 1 END) as employed_count,
                COUNT(CASE WHEN current_status = 'Self-employed' THEN 1 END) as self_employed_count,
                COUNT(CASE WHEN current_status = 'Unemployed' THEN 1 END) as unemployed_count,
                COUNT(CASE WHEN current_status = 'Pursuing further studies' THEN 1 END) as further_studies_count,
                ROUND(AVG(skills_relevance_rating), 2) as avg_skills_relevance,
                ROUND(AVG(job_satisfaction_rating), 2) as avg_job_satisfaction,
                COUNT(CASE WHEN would_recommend_atu = 'Yes' THEN 1 END) as would_recommend_count,
                COUNT(CASE WHEN willing_to_mentor = TRUE THEN 1 END) as willing_to_mentor_count
            FROM tracer_study_responses
            WHERE is_completed = TRUE;
        `;

        try {
            await pool.query(query);
            console.log("✅ Tracer Study Responses table created successfully with all indexes, triggers, and views!");
            return true;
        } catch (error) {
            console.error("❌ Error creating tracer_study_responses table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP VIEW IF EXISTS tracer_study_analytics;");
            await pool.query("DROP TABLE IF EXISTS tracer_study_responses CASCADE;");
            console.log("✅ Tracer Study Responses table and views dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping tracer_study_responses table:", error);
            throw error;
        }
    }
};

export default TracerStudyResponseModel;