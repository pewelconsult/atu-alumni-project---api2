// src/models/Connection.js
import pool from "../config/db.js";

const ConnectionModel = {
    // Create connection_requests table
    createTable: async () => {
        const query = `
            -- Create connection_requests table
            CREATE TABLE IF NOT EXISTS connection_requests (
                id SERIAL PRIMARY KEY,
                
                -- Users involved
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Request status
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
                
                -- Optional message
                message TEXT,
                
                -- Timestamps
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                responded_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(sender_id, receiver_id),  -- Can't send multiple requests to same person
                CHECK (sender_id != receiver_id)  -- Can't send request to yourself
            );

            -- Create connections table (for accepted connections)
            CREATE TABLE IF NOT EXISTS connections (
                id SERIAL PRIMARY KEY,
                
                -- Connected users (always store smaller ID first for consistency)
                user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Connection metadata
                connection_request_id INTEGER REFERENCES connection_requests(id) ON DELETE SET NULL,
                
                -- Timestamps
                connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(user1_id, user2_id),
                CHECK (user1_id < user2_id)  -- Ensure user1_id is always smaller
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON connection_requests(sender_id);
            CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON connection_requests(receiver_id);
            CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);
            CREATE INDEX IF NOT EXISTS idx_connection_requests_requested_at ON connection_requests(requested_at);
            
            CREATE INDEX IF NOT EXISTS idx_connections_user1 ON connections(user1_id);
            CREATE INDEX IF NOT EXISTS idx_connections_user2 ON connections(user2_id);
            CREATE INDEX IF NOT EXISTS idx_connections_connected_at ON connections(connected_at);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON connection_requests;
            CREATE TRIGGER update_connection_requests_updated_at
                BEFORE UPDATE ON connection_requests
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create function to auto-create connection when request is accepted
            CREATE OR REPLACE FUNCTION create_connection_on_accept()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Only proceed if status changed to 'accepted'
                IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
                    -- Set responded_at timestamp
                    NEW.responded_at = CURRENT_TIMESTAMP;
                    
                    -- Insert into connections table (with smaller ID first)
                    INSERT INTO connections (user1_id, user2_id, connection_request_id)
                    VALUES (
                        LEAST(NEW.sender_id, NEW.receiver_id),
                        GREATEST(NEW.sender_id, NEW.receiver_id),
                        NEW.id
                    )
                    ON CONFLICT (user1_id, user2_id) DO NOTHING;
                ELSIF NEW.status IN ('declined', 'cancelled') AND OLD.status != NEW.status THEN
                    -- Set responded_at timestamp for declined/cancelled
                    NEW.responded_at = CURRENT_TIMESTAMP;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_create_connection_on_accept ON connection_requests;
            CREATE TRIGGER trigger_create_connection_on_accept
                BEFORE UPDATE ON connection_requests
                FOR EACH ROW
                EXECUTE FUNCTION create_connection_on_accept();

            -- Create function to delete connection when request is cancelled
            CREATE OR REPLACE FUNCTION delete_connection_on_cancel()
            RETURNS TRIGGER AS $$
            BEGIN
                -- If request is cancelled or declined, remove the connection
                IF NEW.status IN ('cancelled', 'declined') THEN
                    DELETE FROM connections 
                    WHERE (user1_id = LEAST(NEW.sender_id, NEW.receiver_id) 
                       AND user2_id = GREATEST(NEW.sender_id, NEW.receiver_id));
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_delete_connection_on_cancel ON connection_requests;
            CREATE TRIGGER trigger_delete_connection_on_cancel
                AFTER UPDATE ON connection_requests
                FOR EACH ROW
                EXECUTE FUNCTION delete_connection_on_cancel();

            -- Create views for easier querying

            -- View: User's connections with details
            CREATE OR REPLACE VIEW v_user_connections AS
            SELECT 
                c.id as connection_id,
                c.user1_id,
                c.user2_id,
                c.connected_at,
                u1.id as user1_full_id,
                u1.first_name || ' ' || u1.last_name as user1_name,
                u1.email as user1_email,
                u1.profile_picture as user1_picture,
                u1.current_company as user1_company,
                u1.job_title as user1_title,
                u2.id as user2_full_id,
                u2.first_name || ' ' || u2.last_name as user2_name,
                u2.email as user2_email,
                u2.profile_picture as user2_picture,
                u2.current_company as user2_company,
                u2.job_title as user2_title
            FROM connections c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            WHERE u1.is_active = TRUE AND u2.is_active = TRUE;

            -- View: Connection requests with user details
            CREATE OR REPLACE VIEW v_connection_requests AS
            SELECT 
                cr.id,
                cr.sender_id,
                cr.receiver_id,
                cr.status,
                cr.message,
                cr.requested_at,
                cr.responded_at,
                sender.first_name || ' ' || sender.last_name as sender_name,
                sender.email as sender_email,
                sender.profile_picture as sender_picture,
                sender.current_company as sender_company,
                sender.job_title as sender_title,
                receiver.first_name || ' ' || receiver.last_name as receiver_name,
                receiver.email as receiver_email,
                receiver.profile_picture as receiver_picture,
                receiver.current_company as receiver_company,
                receiver.job_title as receiver_title
            FROM connection_requests cr
            JOIN users sender ON cr.sender_id = sender.id
            JOIN users receiver ON cr.receiver_id = receiver.id
            WHERE sender.is_active = TRUE AND receiver.is_active = TRUE;
        `;

        try {
            await pool.query(query);
            console.log("✅ Connection tables created successfully with all indexes, triggers, and views!");
            return true;
        } catch (error) {
            console.error("❌ Error creating connection tables:", error);
            throw error;
        }
    },

    // Drop tables
    dropTables: async () => {
        try {
            await pool.query("DROP VIEW IF EXISTS v_user_connections CASCADE;");
            await pool.query("DROP VIEW IF EXISTS v_connection_requests CASCADE;");
            await pool.query("DROP FUNCTION IF EXISTS create_connection_on_accept() CASCADE;");
            await pool.query("DROP FUNCTION IF EXISTS delete_connection_on_cancel() CASCADE;");
            await pool.query("DROP TABLE IF EXISTS connections CASCADE;");
            await pool.query("DROP TABLE IF EXISTS connection_requests CASCADE;");
            console.log("✅ Connection tables dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping connection tables:", error);
            throw error;
        }
    }
};

export default ConnectionModel;