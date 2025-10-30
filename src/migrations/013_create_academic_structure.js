// src/migrations/013_create_academic_structure.js
import AcademicStructureModel from "../models/AcademicStructure.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Academic Structure");
        console.log("============================================\n");

        // Create all academic structure tables
        console.log("📦 Creating academic structure tables...");
        await AcademicStructureModel.createTables();

        console.log("\n============================================");
        console.log("✅ Migration completed successfully!");
        console.log("============================================\n");

        // Show table structures
        console.log("📋 FACULTIES Table Structure:");
        const facultiesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'faculties'
            ORDER BY ordinal_position;
        `);
        console.table(facultiesInfo.rows);

        console.log("\n📋 DEPARTMENTS Table Structure:");
        const departmentsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'departments'
            ORDER BY ordinal_position;
        `);
        console.table(departmentsInfo.rows);

        console.log("\n📋 PROGRAM LEVELS Table Structure:");
        const levelsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'program_levels'
            ORDER BY ordinal_position;
        `);
        console.table(levelsInfo.rows);

        console.log("\n📋 PROGRAMS Table Structure:");
        const programsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'programs'
            ORDER BY ordinal_position;
        `);
        console.table(programsInfo.rows);

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
            AND tc.table_name IN ('departments', 'programs')
            ORDER BY tc.table_name;
        `);
        console.table(relationships.rows);

        console.log("\n📊 Views Created:");
        const views = await pool.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'v_%'
            ORDER BY table_name;
        `);
        console.table(views.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
};

runMigration();