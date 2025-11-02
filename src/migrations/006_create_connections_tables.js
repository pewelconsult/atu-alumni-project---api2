// src/migrations/006_create_connections_tables.js
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (two levels up from migrations folder)
dotenv.config({ path: join(__dirname, '../../.env') });

import ConnectionModel from "../models/Connection.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Connections Tables");
        console.log("============================================\n");

        // Verify database connection
        console.log("🔍 Testing database connection...");
        await pool.query("SELECT NOW()");
        console.log("✅ Database connection successful!\n");

        // Create connections tables
        console.log("📦 Creating connections tables...");
        await ConnectionModel.createTable();

        console.log("\n============================================");
        console.log("✅ Migration completed successfully!");
        console.log("============================================\n");

        // Show connection_requests table structure
        console.log("📋 Connection Requests Table Structure:");
        const requestsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'connection_requests'
            ORDER BY ordinal_position;
        `);
        console.table(requestsInfo.rows);

        // Show connections table structure
        console.log("\n📋 Connections Table Structure:");
        const connectionsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'connections'
            ORDER BY ordinal_position;
        `);
        console.table(connectionsInfo.rows);

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
            AND tc.table_name IN ('connection_requests', 'connections')
            ORDER BY tc.table_name;
        `);
        console.table(relationships.rows);

        // Show triggers
        console.log("\n⚡ Triggers Created:");
        const triggers = await pool.query(`
            SELECT 
                trigger_name,
                event_object_table as table_name,
                action_timing,
                event_manipulation as event
            FROM information_schema.triggers
            WHERE event_object_table IN ('connection_requests', 'connections')
            ORDER BY event_object_table, trigger_name;
        `);
        console.table(triggers.rows);

        // Show views
        console.log("\n👁️ Views Created:");
        const views = await pool.query(`
            SELECT 
                table_name as view_name,
                view_definition
            FROM information_schema.views
            WHERE table_name IN ('v_connection_requests', 'v_user_connections')
            ORDER BY table_name;
        `);
        console.table(views.rows.map(v => ({ view_name: v.view_name })));

        // Show indexes
        console.log("\n🔍 Indexes Created:");
        const indexes = await pool.query(`
            SELECT 
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename IN ('connection_requests', 'connections')
            AND schemaname = 'public'
            ORDER BY tablename, indexname;
        `);
        console.table(indexes.rows.map(i => ({ 
            table: i.tablename, 
            index: i.indexname 
        })));

        // Show functions
        console.log("\n⚙️ Functions Created:");
        const functions = await pool.query(`
            SELECT 
                routine_name as function_name,
                routine_type as type
            FROM information_schema.routines
            WHERE routine_name IN ('create_connection_on_accept', 'delete_connection_on_cancel')
            AND routine_schema = 'public'
            ORDER BY routine_name;
        `);
        console.table(functions.rows);

        console.log("\n✨ All connections system components created successfully!");
        console.log("   - Tables: connection_requests, connections");
        console.log("   - Views: v_connection_requests, v_user_connections");
        console.log("   - Triggers: Auto-create/delete connections on status change");
        console.log("   - Indexes: Optimized for performance");
        console.log("\n🎉 You can now use the connections feature!\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        console.error("\n📝 Error Details:");
        console.error("   Message:", error.message);
        if (error.detail) console.error("   Detail:", error.detail);
        if (error.hint) console.error("   Hint:", error.hint);
        process.exit(1);
    }
};

runMigration();