// src/migrations/015_create_messaging_tables.js
import MessageModel from "../models/Message.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Messaging Tables");
        console.log("============================================\n");

        // Create all messaging tables
        console.log("📦 Creating messaging tables...");
        await MessageModel.createTables();

        console.log("\n============================================");
        console.log("✅ Migration completed successfully!");
        console.log("============================================\n");

        // Show table structures
        const tables = ['conversations', 'messages', 'message_reactions', 'typing_indicators'];

        for (const tableName of tables) {
            console.log(`\n📋 ${tableName.toUpperCase()} Table Structure:`);
            const tableInfo = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [tableName]);
            console.table(tableInfo.rows);
        }

        // Show foreign key relationships
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
            AND tc.table_name IN ('conversations', 'messages', 'message_reactions', 'typing_indicators')
            ORDER BY tc.table_name;
        `);
        console.table(relationships.rows);

        // Show indexes
        console.log("\n📇 Indexes:");
        const indexes = await pool.query(`
            SELECT
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename IN ('conversations', 'messages', 'message_reactions', 'typing_indicators')
            ORDER BY tablename, indexname;
        `);
        console.table(indexes.rows);

        // Show views
        console.log("\n📊 Views Created:");
        const views = await pool.query(`
            SELECT table_name, view_definition
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'v_%message%'
            OR table_name LIKE 'v_%conversation%'
            ORDER BY table_name;
        `);
        console.table(views.rows.map(v => ({ view_name: v.table_name })));

        // Show triggers
        console.log("\n⚡ Triggers:");
        const triggers = await pool.query(`
            SELECT 
                trigger_name,
                event_object_table as table_name,
                action_timing,
                event_manipulation
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND event_object_table IN ('conversations', 'messages')
            ORDER BY event_object_table, trigger_name;
        `);
        console.table(triggers.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
};

runMigration();