// src/migrations/005_create_events_tables.js
import EventModel from "../models/Event.js";
import EventRsvpModel from "../models/EventRsvp.js";
import EventCommentModel from "../models/EventComment.js";
import EventCommentLikeModel from "../models/EventCommentLike.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Events Tables");
        console.log("============================================\n");

        // Create events table
        console.log("📦 Creating events table...");
        await EventModel.createTable();

        // Create event_rsvps table
        console.log("\n📦 Creating event_rsvps table...");
        await EventRsvpModel.createTable();

        // Create event_comments table
        console.log("\n📦 Creating event_comments table...");
        await EventCommentModel.createTable();

        // Create event_comment_likes table
        console.log("\n📦 Creating event_comment_likes table...");
        await EventCommentLikeModel.createTable();

        console.log("\n============================================");
        console.log("✅ Migration completed successfully!");
        console.log("============================================\n");

        // Show tables structure
        console.log("📋 Events Table Structure:");
        const eventsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'events'
            ORDER BY ordinal_position;
        `);
        console.table(eventsInfo.rows);

        console.log("\n📋 Event RSVPs Table Structure:");
        const rsvpsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'event_rsvps'
            ORDER BY ordinal_position;
        `);
        console.table(rsvpsInfo.rows);

        console.log("\n📋 Event Comments Table Structure:");
        const commentsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'event_comments'
            ORDER BY ordinal_position;
        `);
        console.table(commentsInfo.rows);

        console.log("\n📋 Event Comment Likes Table Structure:");
        const likesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'event_comment_likes'
            ORDER BY ordinal_position;
        `);
        console.table(likesInfo.rows);

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
            AND tc.table_name IN ('events', 'event_rsvps', 'event_comments', 'event_comment_likes')
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
            WHERE event_object_table IN ('events', 'event_rsvps', 'event_comments', 'event_comment_likes')
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