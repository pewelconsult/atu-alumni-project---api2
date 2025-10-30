// src/migrations/002_create_jobs_tables.js
import JobModel from "../models/Job.js";
import JobApplicationModel from "../models/JobApplication.js";
import SavedJobModel from "../models/SavedJob.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Jobs Tables");
        console.log("============================================\n");

        // Create jobs table
        console.log("📦 Creating jobs table...");
        await JobModel.createTable();

        // Create job_applications table
        console.log("\n📦 Creating job_applications table...");
        await JobApplicationModel.createTable();

        // Create saved_jobs table
        console.log("\n📦 Creating saved_jobs table...");
        await SavedJobModel.createTable();

        console.log("\n============================================");
        console.log("✅ Migration completed successfully!");
        console.log("============================================\n");

        // Show tables structure
        console.log("📋 Jobs Table Structure:");
        const jobsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'jobs'
            ORDER BY ordinal_position;
        `);
        console.table(jobsInfo.rows);

        console.log("\n📋 Job Applications Table Structure:");
        const applicationsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'job_applications'
            ORDER BY ordinal_position;
        `);
        console.table(applicationsInfo.rows);

        console.log("\n📋 Saved Jobs Table Structure:");
        const savedJobsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'saved_jobs'
            ORDER BY ordinal_position;
        `);
        console.table(savedJobsInfo.rows);

        // Show relationships
        console.log("\n🔗 Foreign Key Relationships:");
        const relationships = await pool.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name IN ('jobs', 'job_applications', 'saved_jobs');
        `);
        console.table(relationships.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
};

runMigration();