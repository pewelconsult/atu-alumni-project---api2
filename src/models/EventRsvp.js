// src/models/EventRsvp.js
import pool from "../config/db.js";

const EventRsvpModel = {
    // Create event_rsvps table
    createTable: async () => {
        const query = `
            -- Create event_rsvps table
            CREATE TABLE IF NOT EXISTS event_rsvps (
                id SERIAL PRIMARY KEY,
                
                -- Foreign keys
                event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- RSVP Details
                status VARCHAR(50) DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
                guests_count INTEGER DEFAULT 0 CHECK (guests_count >= 0),
                notes TEXT,
                
                -- Check-in
                checked_in BOOLEAN DEFAULT FALSE,
                checked_in_at TIMESTAMP,
                
                -- Timestamps
                rsvp_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(event_id, user_id)  -- One RSVP per user per event
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
            CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
            CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);
            CREATE INDEX IF NOT EXISTS idx_event_rsvps_rsvp_at ON event_rsvps(rsvp_at);
            CREATE INDEX IF NOT EXISTS idx_event_rsvps_checked_in ON event_rsvps(checked_in);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_event_rsvps_updated_at ON event_rsvps;
            CREATE TRIGGER update_event_rsvps_updated_at
                BEFORE UPDATE ON event_rsvps
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create trigger to update events.rsvp_count when RSVP is created
            CREATE OR REPLACE FUNCTION increment_event_rsvp_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.status = 'going' THEN
                    UPDATE events 
                    SET rsvp_count = rsvp_count + 1 
                    WHERE id = NEW.event_id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_increment_rsvp ON event_rsvps;
            CREATE TRIGGER trigger_increment_rsvp
                AFTER INSERT ON event_rsvps
                FOR EACH ROW
                EXECUTE FUNCTION increment_event_rsvp_count();

            -- Create trigger to update rsvp_count when RSVP status changes
            CREATE OR REPLACE FUNCTION update_event_rsvp_count()
            RETURNS TRIGGER AS $$
            BEGIN
                -- If changed from 'going' to something else, decrement
                IF OLD.status = 'going' AND NEW.status != 'going' THEN
                    UPDATE events 
                    SET rsvp_count = rsvp_count - 1 
                    WHERE id = NEW.event_id;
                -- If changed to 'going' from something else, increment
                ELSIF OLD.status != 'going' AND NEW.status = 'going' THEN
                    UPDATE events 
                    SET rsvp_count = rsvp_count + 1 
                    WHERE id = NEW.event_id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_update_rsvp ON event_rsvps;
            CREATE TRIGGER trigger_update_rsvp
                AFTER UPDATE ON event_rsvps
                FOR EACH ROW
                EXECUTE FUNCTION update_event_rsvp_count();

            -- Create trigger to decrement rsvp_count when RSVP is deleted
            CREATE OR REPLACE FUNCTION decrement_event_rsvp_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.status = 'going' THEN
                    UPDATE events 
                    SET rsvp_count = rsvp_count - 1 
                    WHERE id = OLD.event_id;
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_decrement_rsvp ON event_rsvps;
            CREATE TRIGGER trigger_decrement_rsvp
                AFTER DELETE ON event_rsvps
                FOR EACH ROW
                EXECUTE FUNCTION decrement_event_rsvp_count();
        `;

        try {
            await pool.query(query);
            console.log("✅ Event RSVPs table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating event_rsvps table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS event_rsvps CASCADE;");
            console.log("✅ Event RSVPs table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping event_rsvps table:", error);
            throw error;
        }
    }
};

export default EventRsvpModel;