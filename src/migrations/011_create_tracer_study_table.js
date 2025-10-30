// src/migrations/011_create_tracer_study_table.js
import TracerStudyResponseModel from "../models/TracerStudyResponse.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Tracer Study Table");
        console.log("============================================\n");

        // Create tracer_study_responses table
        console.log("📦 Creating tracer_study_responses table...");
        await TracerStudyResponseModel.createTable();

        console.log("\n============================================");
        console.log("✅ Migration completed successfully!");
        console.log("============================================\n");

        // Show table structure
        console.log("📋 Tracer Study Responses Table Structure:");
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'tracer_study_responses'
            ORDER BY ordinal_position;
        `);
        console.table(tableInfo.rows);

        // Show constraints
        console.log("\n🔒 Check Constraints:");
        const constraints = await pool.query(`
            SELECT
                conname as constraint_name,
                pg_get_constraintdef(oid) as constraint_definition
            FROM pg_constraint
            WHERE conrelid = 'tracer_study_responses'::regclass
            AND contype = 'c'
            ORDER BY conname;
        `);
        console.table(constraints.rows);

        // Show indexes
        console.log("\n📇 Indexes:");
        const indexes = await pool.query(`
            SELECT
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename = 'tracer_study_responses'
            ORDER BY indexname;
        `);
        console.table(indexes.rows);

        // Show the analytics view
        console.log("\n📊 Analytics View Created:");
        const viewInfo = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'tracer_study_analytics'
            ORDER BY ordinal_position;
        `);
        console.table(viewInfo.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
};

runMigration();