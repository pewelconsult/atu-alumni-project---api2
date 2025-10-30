// src/migrations/001_create_users_table.js
import UserModel from "../models/User.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Users Table");
        console.log("==========================================\n");

        // Create the users table
        await UserModel.createTable();

        console.log("\n==========================================");
        console.log("✅ Migration completed successfully!");
        console.log("==========================================\n");

        // Show table structure
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);

        console.log("📋 Users Table Structure:");
        console.table(tableInfo.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
};

runMigration();