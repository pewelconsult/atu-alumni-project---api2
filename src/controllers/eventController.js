// src/controllers/eventController.js
import pool from "../config/db.js";

const eventController = {
    // Create new event (Admin/Alumni)
    createEvent: async (req, res) => {
        try {
            const {
                created_by,
                title,
                description,
                event_type,
                category,
                start_date,
                end_date,
                location,
                location_type,
                venue_name,
                meeting_link,
                event_image,
                capacity,
                registration_deadline,
                is_free,
                ticket_price,
                currency,
                organizer_name,
                organizer_email,
                organizer_phone,
                tags,
                requirements,
                agenda,
                speakers,
                is_featured,
                is_published
            } = req.body;

            // Validate required fields
            if (!created_by || !title || !description || !event_type || !start_date || !end_date || !location || !location_type) {
                return res.status(400).json({
                    success: false,
                    error: "Created by, title, description, event type, start date, end date, location, and location type are required"
                });
            }

            // Validate event_type
            const validEventTypes = ['Networking', 'Workshop', 'Conference', 'Social', 'Fundraiser', 'Webinar', 'Career Fair', 'Reunion', 'Sports', 'Other'];
            if (!validEventTypes.includes(event_type)) {
                return res.status(400).json({
                    success: false,
                    error: `Event type must be one of: ${validEventTypes.join(', ')}`
                });
            }

            // Validate location_type
            const validLocationTypes = ['In-person', 'Virtual', 'Hybrid'];
            if (!validLocationTypes.includes(location_type)) {
                return res.status(400).json({
                    success: false,
                    error: `Location type must be one of: ${validLocationTypes.join(', ')}`
                });
            }

            // Validate dates
            if (new Date(end_date) <= new Date(start_date)) {
                return res.status(400).json({
                    success: false,
                    error: "End date must be after start date"
                });
            }

            // Check if user exists
            const userCheck = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND is_active = true",
                [created_by]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            // Create event
            const result = await pool.query(
                `INSERT INTO events (
                    created_by, title, description, event_type, category,
                    start_date, end_date, location, location_type, venue_name,
                    meeting_link, event_image, capacity, registration_deadline,
                    is_free, ticket_price, currency, organizer_name, organizer_email,
                    organizer_phone, tags, requirements, agenda, speakers,
                    is_featured, is_published
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
                RETURNING *`,
                [
                    created_by, title, description, event_type, category || null,
                    start_date, end_date, location, location_type, venue_name || null,
                    meeting_link || null, event_image || null, capacity || null, registration_deadline || null,
                    is_free !== undefined ? is_free : true, ticket_price || null, currency || 'GHS',
                    organizer_name || null, organizer_email || null, organizer_phone || null,
                    tags || null, requirements || null, agenda || null, speakers || null,
                    is_featured || false, is_published !== undefined ? is_published : true
                ]
            );

            res.status(201).json({
                success: true,
                message: "Event created successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Create event error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create event"
            });
        }
    },

    // Get all events with filters
    getAllEvents: async (req, res) => {
        try {
            const {
                event_type,
                category,
                location_type,
                is_free,
                is_featured,
                status,
                start_date_from,
                start_date_to,
                search,
                page = 1,
                limit = 20,
                sort_by = 'start_date',
                sort_order = 'ASC'
            } = req.query;

            let queryText = `
                SELECT 
                    e.*,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    u.email as created_by_email
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.is_published = true
            `;

            const queryParams = [];
            let paramCount = 0;

            // Filters
            if (event_type) {
                paramCount++;
                queryText += ` AND e.event_type = $${paramCount}`;
                queryParams.push(event_type);
            }

            if (category) {
                paramCount++;
                queryText += ` AND e.category ILIKE $${paramCount}`;
                queryParams.push(`%${category}%`);
            }

            if (location_type) {
                paramCount++;
                queryText += ` AND e.location_type = $${paramCount}`;
                queryParams.push(location_type);
            }

            if (is_free === 'true') {
                queryText += ` AND e.is_free = true`;
            } else if (is_free === 'false') {
                queryText += ` AND e.is_free = false`;
            }

            if (is_featured === 'true') {
                queryText += ` AND e.is_featured = true`;
            }

            if (status) {
                paramCount++;
                queryText += ` AND e.status = $${paramCount}`;
                queryParams.push(status);
            }

            if (start_date_from) {
                paramCount++;
                queryText += ` AND e.start_date >= $${paramCount}`;
                queryParams.push(start_date_from);
            }

            if (start_date_to) {
                paramCount++;
                queryText += ` AND e.start_date <= $${paramCount}`;
                queryParams.push(start_date_to);
            }

            if (search) {
                paramCount++;
                queryText += ` AND (
                    e.title ILIKE $${paramCount} OR 
                    e.description ILIKE $${paramCount} OR 
                    e.location ILIKE $${paramCount}
                )`;
                queryParams.push(`%${search}%`);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalEvents = parseInt(countResult.rows[0].count);

            // Add sorting and pagination
            const validSortFields = ['start_date', 'end_date', 'created_at', 'title', 'rsvp_count', 'views_count'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'start_date';
            const order = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            const offset = (page - 1) * limit;
            queryText += ` ORDER BY e.${sortField} ${order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalEvents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalEvents / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get events error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch events"
            });
        }
    },

    // Get upcoming events
    getUpcomingEvents: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;

            const queryText = `
                SELECT 
                    e.*,
                    u.first_name || ' ' || u.last_name as created_by_name
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.is_published = true 
                AND e.status = 'upcoming'
                AND e.start_date > CURRENT_TIMESTAMP
                ORDER BY e.start_date ASC
            `;

            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM events 
                 WHERE is_published = true 
                 AND status = 'upcoming'
                 AND start_date > CURRENT_TIMESTAMP`
            );
            const totalEvents = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            const paginatedQuery = `${queryText} LIMIT $1 OFFSET $2`;
            const result = await pool.query(paginatedQuery, [limit, offset]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalEvents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalEvents / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get upcoming events error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch upcoming events"
            });
        }
    },

    // Get past events
    getPastEvents: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;

            const queryText = `
                SELECT 
                    e.*,
                    u.first_name || ' ' || u.last_name as created_by_name
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.is_published = true 
                AND e.status = 'completed'
                AND e.end_date < CURRENT_TIMESTAMP
                ORDER BY e.start_date DESC
            `;

            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM events 
                 WHERE is_published = true 
                 AND status = 'completed'
                 AND end_date < CURRENT_TIMESTAMP`
            );
            const totalEvents = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            const paginatedQuery = `${queryText} LIMIT $1 OFFSET $2`;
            const result = await pool.query(paginatedQuery, [limit, offset]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalEvents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalEvents / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get past events error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch past events"
            });
        }
    },

    // Get single event by ID
    getEventById: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid event ID"
                });
            }

            const result = await pool.query(
                `SELECT 
                    e.*,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    u.email as created_by_email,
                    u.role as created_by_role
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.id = $1 AND e.is_published = true`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Event not found"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get event error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch event"
            });
        }
    },

    // Update event
    updateEvent: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid event ID"
                });
            }

            // Check if event exists
            const eventCheck = await pool.query(
                "SELECT id FROM events WHERE id = $1",
                [id]
            );

            if (eventCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Event not found"
                });
            }

            // Allowed fields to update
            const allowedFields = [
                'title', 'description', 'event_type', 'category', 'start_date', 'end_date',
                'location', 'location_type', 'venue_name', 'meeting_link', 'event_image',
                'capacity', 'registration_deadline', 'is_free', 'ticket_price', 'currency',
                'organizer_name', 'organizer_email', 'organizer_phone', 'tags',
                'requirements', 'agenda', 'speakers', 'is_featured', 'is_published', 'status'
            ];

            const updates = [];
            const values = [];
            let paramCount = 0;

            Object.keys(req.body).forEach(key => {
                if (allowedFields.includes(key)) {
                    paramCount++;
                    updates.push(`${key} = $${paramCount}`);
                    values.push(req.body[key]);
                }
            });

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "No valid fields to update"
                });
            }

            values.push(id);
            paramCount++;

            const queryText = `
                UPDATE events 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(queryText, values);

            res.status(200).json({
                success: true,
                message: "Event updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update event error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update event"
            });
        }
    },

    // Delete event (soft delete)
    deleteEvent: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid event ID"
                });
            }

            const eventCheck = await pool.query(
                "SELECT id FROM events WHERE id = $1",
                [id]
            );

            if (eventCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Event not found"
                });
            }

            await pool.query(
                "UPDATE events SET is_published = false WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "Event deleted successfully"
            });

        } catch (error) {
            console.error("Delete event error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete event"
            });
        }
    },

    // Increment view count
    incrementViewCount: async (req, res) => {
        try {
            const { id } = req.params;

            await pool.query(
                "UPDATE events SET views_count = views_count + 1 WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "View count updated"
            });

        } catch (error) {
            console.error("Increment view error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update view count"
            });
        }
    },

    // RSVP to event
    rsvpToEvent: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, status, guests_count, notes } = req.body;

            if (!user_id || !status) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and status are required"
                });
            }

            // Validate status
            const validStatuses = ['going', 'maybe', 'not_going'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }

            // Check if event exists and is published
            const eventCheck = await pool.query(
                "SELECT id, capacity, rsvp_count, registration_deadline FROM events WHERE id = $1 AND is_published = true",
                [id]
            );

            if (eventCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Event not found or not published"
                });
            }

            const event = eventCheck.rows[0];

            // Check if registration deadline has passed
            if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
                return res.status(400).json({
                    success: false,
                    error: "Registration deadline has passed"
                });
            }

            // Check capacity
            if (status === 'going' && event.capacity && event.rsvp_count >= event.capacity) {
                return res.status(400).json({
                    success: false,
                    error: "Event is at full capacity"
                });
            }

            // Check if user already RSVP'd
            const existingRsvp = await pool.query(
                "SELECT id, status FROM event_rsvps WHERE event_id = $1 AND user_id = $2",
                [id, user_id]
            );

            if (existingRsvp.rows.length > 0) {
                // Update existing RSVP
                const result = await pool.query(
                    `UPDATE event_rsvps 
                     SET status = $1, guests_count = $2, notes = $3
                     WHERE event_id = $4 AND user_id = $5
                     RETURNING *`,
                    [status, guests_count || 0, notes || null, id, user_id]
                );

                return res.status(200).json({
                    success: true,
                    message: "RSVP updated successfully",
                    data: result.rows[0]
                });
            }

            // Create new RSVP
            const result = await pool.query(
                `INSERT INTO event_rsvps (event_id, user_id, status, guests_count, notes)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [id, user_id, status, guests_count || 0, notes || null]
            );

            res.status(201).json({
                success: true,
                message: "RSVP submitted successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("RSVP to event error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to submit RSVP"
            });
        }
    },

    // Update RSVP
    updateRsvp: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, status, guests_count, notes } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                `UPDATE event_rsvps 
                 SET status = COALESCE($1, status), 
                     guests_count = COALESCE($2, guests_count),
                     notes = COALESCE($3, notes)
                 WHERE event_id = $4 AND user_id = $5
                 RETURNING *`,
                [status, guests_count, notes, id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "RSVP not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "RSVP updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update RSVP error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update RSVP"
            });
        }
    },

    // Cancel RSVP
    cancelRsvp: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2 RETURNING *",
                [id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "RSVP not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "RSVP cancelled successfully"
            });

        } catch (error) {
            console.error("Cancel RSVP error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to cancel RSVP"
            });
        }
    },

    // Get my events (events user is attending)
    getMyEvents: async (req, res) => {
        try {
            const { user_id } = req.query;
            const { status, page = 1, limit = 20 } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            let queryText = `
                SELECT 
                    er.*,
                    e.title,
                    e.description,
                    e.event_type,
                    e.start_date,
                    e.end_date,
                    e.location,
                    e.location_type,
                    e.event_image,
                    e.is_free,
                    e.status as event_status
                FROM event_rsvps er
                JOIN events e ON er.event_id = e.id
                WHERE er.user_id = $1 AND e.is_published = true
            `;

            const queryParams = [user_id];
            let paramCount = 1;

            if (status) {
                paramCount++;
                queryText += ` AND er.status = $${paramCount}`;
                queryParams.push(status);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalEvents = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            queryText += ` ORDER BY e.start_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalEvents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalEvents / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get my events error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch events"
            });
        }
    },

    // Get event attendees (for admin)
    getEventAttendees: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, checked_in, page = 1, limit = 50 } = req.query;

            let queryText = `
                SELECT 
                    er.*,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone_number,
                    u.graduation_year,
                    u.program_of_study,
                    u.profile_picture
                FROM event_rsvps er
                JOIN users u ON er.user_id = u.id
                WHERE er.event_id = $1
            `;

            const queryParams = [id];
            let paramCount = 1;

            if (status) {
                paramCount++;
                queryText += ` AND er.status = $${paramCount}`;
                queryParams.push(status);
            }

            if (checked_in === 'true') {
                queryText += ` AND er.checked_in = true`;
            } else if (checked_in === 'false') {
                queryText += ` AND er.checked_in = false`;
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalAttendees = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            queryText += ` ORDER BY er.rsvp_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalAttendees,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalAttendees / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get attendees error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch attendees"
            });
        }
    },

    // Check-in attendee (for admin)
    checkInAttendee: async (req, res) => {
        try {
            const { id, userId } = req.params;

            const result = await pool.query(
                `UPDATE event_rsvps 
                 SET checked_in = true, checked_in_at = CURRENT_TIMESTAMP
                 WHERE event_id = $1 AND user_id = $2
                 RETURNING *`,
                [id, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "RSVP not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Attendee checked in successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Check-in attendee error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to check in attendee"
            });
        }
    },

    // Publish event (for admin)
    publishEvent: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "UPDATE events SET is_published = true WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Event not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Event published successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Publish event error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to publish event"
            });
        }
    },

    // Get event statistics
    getEventStats: async (req, res) => {
        try {
            // Total events
            const totalResult = await pool.query(
                "SELECT COUNT(*) as total FROM events WHERE is_published = true"
            );

            // Events by type
            const typeResult = await pool.query(
                `SELECT event_type, COUNT(*) as count 
                 FROM events 
                 WHERE is_published = true 
                 GROUP BY event_type 
                 ORDER BY count DESC`
            );

            // Events by status
            const statusResult = await pool.query(
                `SELECT status, COUNT(*) as count 
                 FROM events 
                 WHERE is_published = true 
                 GROUP BY status 
                 ORDER BY count DESC`
            );

            // Total RSVPs
            const rsvpResult = await pool.query(
                "SELECT COUNT(*) as total FROM event_rsvps WHERE status = 'going'"
            );

            // Average attendance rate
            const attendanceResult = await pool.query(
                `SELECT 
                    AVG(CASE WHEN capacity > 0 THEN (rsvp_count::float / capacity) * 100 ELSE 0 END) as avg_rate
                 FROM events 
                 WHERE is_published = true AND capacity IS NOT NULL`
            );

            // Most popular events
            const popularResult = await pool.query(
                `SELECT id, title, event_type, start_date, rsvp_count, views_count 
                 FROM events 
                 WHERE is_published = true 
                 ORDER BY rsvp_count DESC 
                 LIMIT 10`
            );

            // Upcoming events count
            const upcomingResult = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM events 
                 WHERE is_published = true 
                 AND status = 'upcoming'`
            );

            res.status(200).json({
                success: true,
                data: {
                    total_events: parseInt(totalResult.rows[0].total),
                    total_rsvps: parseInt(rsvpResult.rows[0].total),
                    upcoming_events: parseInt(upcomingResult.rows[0].count),
                    avg_attendance_rate: parseFloat(attendanceResult.rows[0].avg_rate || 0).toFixed(2),
                    by_event_type: typeResult.rows,
                    by_status: statusResult.rows,
                    most_popular_events: popularResult.rows
                }
            });

        } catch (error) {
            console.error("Get event stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch event statistics"
            });
        }
    },

    // Get event comments
    getEventComments: async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;

            // Get comments with user info and reply count
            const queryText = `
                SELECT 
                    ec.*,
                    u.first_name,
                    u.last_name,
                    u.profile_picture,
                    (SELECT COUNT(*) FROM event_comments WHERE parent_comment_id = ec.id AND is_deleted = false) as reply_count,
                    (SELECT COUNT(*) > 0 FROM event_comment_likes WHERE comment_id = ec.id AND user_id = $3) as user_has_liked
                FROM event_comments ec
                JOIN users u ON ec.user_id = u.id
                WHERE ec.event_id = $1 
                AND ec.parent_comment_id IS NULL
                AND ec.is_deleted = false
                ORDER BY ec.created_at DESC
                LIMIT $2 OFFSET $4
            `;

            const offset = (page - 1) * limit;
            const result = await pool.query(queryText, [id, limit, req.query.user_id || 0, offset]);

            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM event_comments 
                 WHERE event_id = $1 AND parent_comment_id IS NULL AND is_deleted = false`,
                [id]
            );

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: parseInt(countResult.rows[0].count),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get comments error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch comments"
            });
        }
    },

    // Get comment replies
    getCommentReplies: async (req, res) => {
        try {
            const { id, commentId } = req.params;

            const queryText = `
                SELECT 
                    ec.*,
                    u.first_name,
                    u.last_name,
                    u.profile_picture,
                    (SELECT COUNT(*) > 0 FROM event_comment_likes WHERE comment_id = ec.id AND user_id = $3) as user_has_liked
                FROM event_comments ec
                JOIN users u ON ec.user_id = u.id
                WHERE ec.parent_comment_id = $1
                AND ec.is_deleted = false
                ORDER BY ec.created_at ASC
            `;

            const result = await pool.query(queryText, [commentId, id, req.query.user_id || 0]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get replies error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch replies"
            });
        }
    },

    // Add comment
    addComment: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, comment } = req.body;

            if (!user_id || !comment) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and comment are required"
                });
            }

            if (comment.length < 1 || comment.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: "Comment must be between 1 and 2000 characters"
                });
            }

            // Check if event exists
            const eventCheck = await pool.query(
                "SELECT id FROM events WHERE id = $1 AND is_published = true",
                [id]
            );

            if (eventCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Event not found"
                });
            }

            const result = await pool.query(
                `INSERT INTO event_comments (event_id, user_id, comment)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [id, user_id, comment]
            );

            // Get user info
            const userInfo = await pool.query(
                "SELECT first_name, last_name, profile_picture FROM users WHERE id = $1",
                [user_id]
            );

            const commentData = {
                ...result.rows[0],
                ...userInfo.rows[0],
                reply_count: 0,
                user_has_liked: false
            };

            res.status(201).json({
                success: true,
                message: "Comment added successfully",
                data: commentData
            });

        } catch (error) {
            console.error("Add comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to add comment"
            });
        }
    },

    // Reply to comment
    replyToComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id, comment } = req.body;

            if (!user_id || !comment) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and comment are required"
                });
            }

            if (comment.length < 1 || comment.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: "Comment must be between 1 and 2000 characters"
                });
            }

            // Check if parent comment exists
            const commentCheck = await pool.query(
                "SELECT id FROM event_comments WHERE id = $1 AND event_id = $2",
                [commentId, id]
            );

            if (commentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Parent comment not found"
                });
            }

            const result = await pool.query(
                `INSERT INTO event_comments (event_id, user_id, parent_comment_id, comment)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [id, user_id, commentId, comment]
            );

            // Get user info
            const userInfo = await pool.query(
                "SELECT first_name, last_name, profile_picture FROM users WHERE id = $1",
                [user_id]
            );

            const commentData = {
                ...result.rows[0],
                ...userInfo.rows[0],
                user_has_liked: false
            };

            res.status(201).json({
                success: true,
                message: "Reply added successfully",
                data: commentData
            });

        } catch (error) {
            console.error("Reply to comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to add reply"
            });
        }
    },

    // Update comment
    updateComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id, comment } = req.body;

            if (!user_id || !comment) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and comment are required"
                });
            }

            if (comment.length < 1 || comment.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: "Comment must be between 1 and 2000 characters"
                });
            }

            const result = await pool.query(
                `UPDATE event_comments 
                 SET comment = $1
                 WHERE id = $2 AND event_id = $3 AND user_id = $4
                 RETURNING *`,
                [comment, commentId, id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Comment not found or you don't have permission to edit"
                });
            }

            res.status(200).json({
                success: true,
                message: "Comment updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update comment"
            });
        }
    },

    // Delete comment (soft delete)
    deleteComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                `UPDATE event_comments 
                 SET is_deleted = true, comment = '[Comment deleted]'
                 WHERE id = $1 AND event_id = $2 AND user_id = $3
                 RETURNING *`,
                [commentId, id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Comment not found or you don't have permission to delete"
                });
            }

            res.status(200).json({
                success: true,
                message: "Comment deleted successfully"
            });

        } catch (error) {
            console.error("Delete comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete comment"
            });
        }
    },

    // Like comment
    likeComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if already liked
            const existingLike = await pool.query(
                "SELECT id FROM event_comment_likes WHERE comment_id = $1 AND user_id = $2",
                [commentId, user_id]
            );

            if (existingLike.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Comment already liked"
                });
            }

            await pool.query(
                "INSERT INTO event_comment_likes (comment_id, user_id) VALUES ($1, $2)",
                [commentId, user_id]
            );

            // Get updated likes count
            const commentResult = await pool.query(
                "SELECT likes_count FROM event_comments WHERE id = $1",
                [commentId]
            );

            res.status(201).json({
                success: true,
                message: "Comment liked successfully",
                data: {
                    likes_count: commentResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Like comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to like comment"
            });
        }
    },

    // Unlike comment
    unlikeComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "DELETE FROM event_comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING *",
                [commentId, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Like not found"
                });
            }

            // Get updated likes count
            const commentResult = await pool.query(
                "SELECT likes_count FROM event_comments WHERE id = $1",
                [commentId]
            );

            res.status(200).json({
                success: true,
                message: "Comment unliked successfully",
                data: {
                    likes_count: commentResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Unlike comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unlike comment"
            });
        }
    }
};

export default eventController;