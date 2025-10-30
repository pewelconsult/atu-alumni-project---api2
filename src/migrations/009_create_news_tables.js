// src/migrations/009_create_news_tables.js
import NewsArticleModel from "../models/NewsArticle.js";
import NewsCommentModel from "../models/NewsComment.js";
import NewsLikeModel from "../models/NewsLike.js";
import NewsCommentLikeModel from "../models/NewsCommentLike.js";
import pool from "../config/db.js";

const runMigration = async () => {
    try {
        console.log("🚀 Starting migration: Create News Tables");
        console.log("============================================\n");

        // Create news_articles table
        console.log("📦 Creating news_articles table...");
        await NewsArticleModel.createTable();

        // Create news_comments table
        console.log("\n📦 Creating news_comments table...");
        await NewsCommentModel.createTable();

        // Create news_likes table
        console.log("\n📦 Creating news_likes table...");
        await NewsLikeModel.createTable();

        // Create news_comment_likes table
        console.log("\n📦 Creating news_comment_likes table...");
        await NewsCommentLikeModel.createTable();

        console.log("\n============================================");
        console.log("✅ Migration completed successfully!");
        console.log("============================================\n");

        // Show tables structure
        console.log("📋 News Articles Table Structure:");
        const articlesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'news_articles'
            ORDER BY ordinal_position;
        `);
        console.table(articlesInfo.rows);

        console.log("\n📋 News Comments Table Structure:");
        const commentsInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'news_comments'
            ORDER BY ordinal_position;
        `);
        console.table(commentsInfo.rows);

        console.log("\n📋 News Likes Table Structure:");
        const likesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'news_likes'
            ORDER BY ordinal_position;
        `);
        console.table(likesInfo.rows);

        console.log("\n📋 News Comment Likes Table Structure:");
        const commentLikesInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'news_comment_likes'
            ORDER BY ordinal_position;
        `);
        console.table(commentLikesInfo.rows);

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
            AND tc.table_name IN ('news_articles', 'news_comments', 'news_likes', 'news_comment_likes')
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
            WHERE event_object_table IN ('news_articles', 'news_comments', 'news_likes', 'news_comment_likes')
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