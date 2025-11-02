// src/models/Message.js
import pool from "../config/db.js";

const MessageModel = {
    // Create all messaging tables
    createTables: async () => {
        const query = `
            -- ==================== CONVERSATIONS ====================
            -- A conversation is between two users
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                
                -- Participants (exactly 2 users)
                user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Last Message Info (for quick loading of conversation list)
                last_message_id INTEGER,
                last_message_at TIMESTAMP,
                last_message_preview TEXT,
                
                -- Status
                is_archived_by_user1 BOOLEAN DEFAULT FALSE,
                is_archived_by_user2 BOOLEAN DEFAULT FALSE,
                is_blocked_by_user1 BOOLEAN DEFAULT FALSE,
                is_blocked_by_user2 BOOLEAN DEFAULT FALSE,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CHECK (user1_id < user2_id), -- Ensure consistent ordering
                UNIQUE(user1_id, user2_id)
            );

            -- ==================== MESSAGES ====================
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                
                -- Relationships
                conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Message Content
                message_text TEXT NOT NULL,
                
                -- Attachments (optional)
                attachment_url VARCHAR(500),
                attachment_type VARCHAR(50), -- image, document, video, audio
                attachment_name VARCHAR(255),
                attachment_size INTEGER, -- in bytes
                
                -- Status
                is_read BOOLEAN DEFAULT FALSE,
                read_at TIMESTAMP,
                is_deleted_by_sender BOOLEAN DEFAULT FALSE,
                is_deleted_by_receiver BOOLEAN DEFAULT FALSE,
                is_edited BOOLEAN DEFAULT FALSE,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CHECK (LENGTH(message_text) > 0 AND LENGTH(message_text) <= 5000)
            );

            -- ==================== MESSAGE REACTIONS ====================
            CREATE TABLE IF NOT EXISTS message_reactions (
                id SERIAL PRIMARY KEY,
                
                -- Relationships
                message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Reaction
                reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN 
                    ('like', 'love', 'haha', 'wow', 'sad', 'angry')
                ),
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(message_id, user_id)
            );

            -- ==================== TYPING INDICATORS ====================
            CREATE TABLE IF NOT EXISTS typing_indicators (
                id SERIAL PRIMARY KEY,
                
                -- Relationships
                conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Timestamps
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '10 seconds',
                
                -- Constraints
                UNIQUE(conversation_id, user_id)
            );

            -- ==================== INDEXES ====================
            
            -- Conversations indexes
            CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
            CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
            CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
            CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
            
            -- Messages indexes
            CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
            CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
            
            -- Message reactions indexes
            CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
            CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
            
            -- Typing indicators indexes
            CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);

            -- ==================== TRIGGERS ====================
            
            -- Update conversations.updated_at
            DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
            CREATE TRIGGER update_conversations_updated_at
                BEFORE UPDATE ON conversations
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Update messages.updated_at
            DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
            CREATE TRIGGER update_messages_updated_at
                BEFORE UPDATE ON messages
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Update conversation when new message is sent
            CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE conversations
                SET 
                    last_message_id = NEW.id,
                    last_message_at = NEW.created_at,
                    last_message_preview = LEFT(NEW.message_text, 100)
                WHERE id = NEW.conversation_id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
            CREATE TRIGGER trigger_update_conversation_on_message
                AFTER INSERT ON messages
                FOR EACH ROW
                EXECUTE FUNCTION update_conversation_on_new_message();

            -- Clean up expired typing indicators (function for scheduled cleanup)
            CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
            RETURNS void AS $$
            BEGIN
                DELETE FROM typing_indicators WHERE expires_at < NOW();
            END;
            $$ LANGUAGE plpgsql;

            -- ==================== VIEWS ====================

            -- View: User conversations with unread count
            CREATE OR REPLACE VIEW v_user_conversations AS
            SELECT 
                c.id as conversation_id,
                c.user1_id,
                c.user2_id,
                c.last_message_at,
                c.last_message_preview,
                c.created_at as conversation_created_at,
                
                -- User 1 perspective
                u2.id as other_user_id_for_user1,
                u2.first_name || ' ' || u2.last_name as other_user_name_for_user1,
                u2.profile_picture as other_user_picture_for_user1,
                COUNT(CASE WHEN m.sender_id = c.user2_id AND m.is_read = FALSE 
                    AND m.is_deleted_by_receiver = FALSE THEN 1 END) as unread_count_for_user1,
                c.is_archived_by_user1,
                c.is_blocked_by_user1,
                
                -- User 2 perspective
                u1.id as other_user_id_for_user2,
                u1.first_name || ' ' || u1.last_name as other_user_name_for_user2,
                u1.profile_picture as other_user_picture_for_user2,
                COUNT(CASE WHEN m.sender_id = c.user1_id AND m.is_read = FALSE 
                    AND m.is_deleted_by_receiver = FALSE THEN 1 END) as unread_count_for_user2,
                c.is_archived_by_user2,
                c.is_blocked_by_user2
                
            FROM conversations c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            LEFT JOIN messages m ON c.id = m.conversation_id
            GROUP BY 
                c.id, c.user1_id, c.user2_id, c.last_message_at, 
                c.last_message_preview, c.created_at,
                u1.id, u1.first_name, u1.last_name, u1.profile_picture,
                u2.id, u2.first_name, u2.last_name, u2.profile_picture,
                c.is_archived_by_user1, c.is_blocked_by_user1,
                c.is_archived_by_user2, c.is_blocked_by_user2;

            -- View: Message statistics
            CREATE OR REPLACE VIEW v_message_stats AS
            SELECT 
                COUNT(*) as total_messages,
                COUNT(DISTINCT conversation_id) as total_conversations,
                COUNT(CASE WHEN is_read = FALSE THEN 1 END) as total_unread_messages,
                COUNT(CASE WHEN attachment_url IS NOT NULL THEN 1 END) as messages_with_attachments,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as messages_today,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as messages_this_week,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as messages_this_month
            FROM messages
            WHERE is_deleted_by_sender = FALSE AND is_deleted_by_receiver = FALSE;
        `;

        try {
            await pool.query(query);
            console.log("✅ Messaging tables created successfully with all indexes, triggers, and views!");
            return true;
        } catch (error) {
            console.error("❌ Error creating messaging tables:", error);
            throw error;
        }
    },

    // Drop all tables
    dropTables: async () => {
        try {
            await pool.query("DROP VIEW IF EXISTS v_user_conversations CASCADE;");
            await pool.query("DROP VIEW IF EXISTS v_message_stats CASCADE;");
            await pool.query("DROP FUNCTION IF EXISTS cleanup_expired_typing_indicators() CASCADE;");
            await pool.query("DROP FUNCTION IF EXISTS update_conversation_on_new_message() CASCADE;");
            await pool.query("DROP TABLE IF EXISTS typing_indicators CASCADE;");
            await pool.query("DROP TABLE IF EXISTS message_reactions CASCADE;");
            await pool.query("DROP TABLE IF EXISTS messages CASCADE;");
            await pool.query("DROP TABLE IF EXISTS conversations CASCADE;");
            console.log("✅ Messaging tables dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping messaging tables:", error);
            throw error;
        }
    }
};

export default MessageModel;