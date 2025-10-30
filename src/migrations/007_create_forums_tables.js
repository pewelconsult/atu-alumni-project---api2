// src/migrations/007_create_forums_tables.js
import ForumCategoryModel from "../models/ForumCategory.js";
import ForumPostModel from "../models/ForumPost.js";
import ForumReplyModel from "../models/ForumReply.js";
import ForumPostLikeModel from "../models/ForumPostLike.js";
import ForumReplyLikeModel from "../models/ForumReplyLike.js";
import ForumSubscriptionModel from "../models/ForumSubscription.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create Forums Tables");
        console.log("=============================================\n");

        // Create forum_categories table
        console.log("📦 Creating forum_categories table...");
        await ForumCategoryModel.createTable();

        // Create forum_posts table
        console.log("\n📦 Creating forum_posts table...");
        await ForumPostModel.createTable();

        // Create forum_replies table
        console.log("\n📦 Creating forum_replies table...");
        await ForumReplyModel.createTable();

        // Create forum_post_likes table
        console.log("\n📦 Creating forum_post_likes table...");
        await ForumPostLikeModel.createTable();

        // Create forum_reply_likes table
        console.log("\n📦 Creating forum_reply_likes table...");
        await ForumReplyLikeModel.createTable();

        // Create forum_subscriptions table
        console.log("\n📦 Creating forum_subscriptions table...");
        await ForumSubscriptionModel.createTable();

        console.log("\n=============================================");
        console.log("✅ Migration completed successfully!");
        console.log("=============================================\n");

        // Show tables structure
        console.log("📋 Forum Categories Table Structure:");
        const categoriesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'forum_categories'
            ORDER BY ordinal_position;
        `);
        console.table(categoriesInfo.rows);

        console.log("\n📋 Forum Posts Table Structure:");
        const postsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'forum_posts'
            ORDER BY ordinal_position;
        `);
        console.table(postsInfo.rows);

        console.log("\n📋 Forum Replies Table Structure:");
        const repliesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'forum_replies'
            ORDER BY ordinal_position;
        `);
        console.table(repliesInfo.rows);

        console.log("\n📋 Forum Post Likes Table Structure:");
        const postLikesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'forum_post_likes'
            ORDER BY ordinal_position;
        `);
        console.table(postLikesInfo.rows);

        console.log("\n📋 Forum Reply Likes Table Structure:");
        const replyLikesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'forum_reply_likes'
            ORDER BY ordinal_position;
        `);
        console.table(replyLikesInfo.rows);

        console.log("\n📋 Forum Subscriptions Table Structure:");
        const subscriptionsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'forum_subscriptions'
            ORDER BY ordinal_position;
        `);
        console.table(subscriptionsInfo.rows);

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
            AND tc.table_name IN ('forum_categories', 'forum_posts', 'forum_replies', 'forum_post_likes', 'forum_reply_likes', 'forum_subscriptions')
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
            WHERE event_object_table IN ('forum_categories', 'forum_posts', 'forum_replies', 'forum_post_likes', 'forum_reply_likes', 'forum_subscriptions')
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