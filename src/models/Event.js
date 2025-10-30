// src/models/Event.js
import pool from "../config/db.js";

const EventModel = {
    // Create events table
    createTable: async () => {
        const query = `
            -- Create events table
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                
                -- Created by (Foreign key to users)
                created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                
                -- Basic Information
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Networking', 'Workshop', 'Conference', 'Social', 'Fundraiser', 'Webinar', 'Career Fair', 'Reunion', 'Sports', 'Other')),
                category VARCHAR(100),
                
                -- Date & Time
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                
                -- Location
                location VARCHAR(255) NOT NULL,
                location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('In-person', 'Virtual', 'Hybrid')),
                venue_name VARCHAR(255),
                meeting_link VARCHAR(500),
                
                -- Media
                event_image VARCHAR(500),
                
                -- Registration
                capacity INTEGER,
                registration_deadline TIMESTAMP,
                
                -- Pricing
                is_free BOOLEAN DEFAULT TRUE,
                ticket_price DECIMAL(10,2),
                currency VARCHAR(10) DEFAULT 'GHS',
                
                -- Organizer
                organizer_name VARCHAR(255),
                organizer_email VARCHAR(255),
                organizer_phone VARCHAR(20),
                
                -- Additional Details
                tags TEXT[],
                requirements TEXT,
                agenda TEXT,
                speakers JSONB,
                
                -- Status & Visibility
                is_published BOOLEAN DEFAULT TRUE,
                is_featured BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
                
                -- Metrics
                views_count INTEGER DEFAULT 0,
                rsvp_count INTEGER DEFAULT 0,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                CHECK (end_date > start_date),
                CHECK (capacity IS NULL OR capacity > 0),
                CHECK (ticket_price IS NULL OR ticket_price >= 0)
            );

            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
            CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
            CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
            CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
            CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
            CREATE INDEX IF NOT EXISTS idx_events_location_type ON events(location_type);
            CREATE INDEX IF NOT EXISTS idx_events_is_published ON events(is_published);
            CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
            CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
            CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
            CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

            -- Create trigger to auto-update updated_at
            DROP TRIGGER IF EXISTS update_events_updated_at ON events;
            CREATE TRIGGER update_events_updated_at
                BEFORE UPDATE ON events
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Create function to auto-update event status based on dates
            CREATE OR REPLACE FUNCTION update_event_status()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.start_date <= CURRENT_TIMESTAMP AND NEW.end_date > CURRENT_TIMESTAMP THEN
                    NEW.status = 'ongoing';
                ELSIF NEW.end_date <= CURRENT_TIMESTAMP THEN
                    NEW.status = 'completed';
                ELSIF NEW.start_date > CURRENT_TIMESTAMP THEN
                    NEW.status = 'upcoming';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Create trigger to auto-update event status
            DROP TRIGGER IF EXISTS trigger_update_event_status ON events;
            CREATE TRIGGER trigger_update_event_status
                BEFORE INSERT OR UPDATE ON events
                FOR EACH ROW
                EXECUTE FUNCTION update_event_status();
        `;

        try {
            await pool.query(query);
            console.log("✅ Events table created successfully with all indexes and triggers!");
            return true;
        } catch (error) {
            console.error("❌ Error creating events table:", error);
            throw error;
        }
    },

    // Drop table
    dropTable: async () => {
        try {
            await pool.query("DROP TABLE IF EXISTS events CASCADE;");
            console.log("✅ Events table dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping events table:", error);
            throw error;
        }
    }
};

export default EventModel;