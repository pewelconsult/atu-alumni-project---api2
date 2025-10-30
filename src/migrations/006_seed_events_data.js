// src/migrations/006_seed_events_data.js
import pool from "../config/db.js";

const seedEventsData = async () => {
    try {
        console.log("🌱 Starting events data seeding...\n");

        // Get admin user
        const adminResult = await pool.query(
            "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
        );

        if (adminResult.rows.length === 0) {
            console.log("❌ No admin user found. Please create an admin first.");
            process.exit(1);
        }

        const adminId = adminResult.rows[0].id;
        console.log(`✅ Using admin (ID: ${adminId})\n`);

        // Sample events data
        const events = [
            {
                title: "Tech Alumni Networking Night",
                description: "Join us for an evening of networking with fellow tech alumni! This is a great opportunity to connect with professionals in the tech industry, share experiences, and build valuable connections. Light refreshments will be served.",
                event_type: "Networking",
                category: "Career",
                start_date: "2025-11-15 18:00:00",
                end_date: "2025-11-15 21:00:00",
                location: "Accra Digital Centre, East Legon",
                location_type: "In-person",
                venue_name: "Accra Digital Centre",
                event_image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                capacity: 100,
                registration_deadline: "2025-11-14 23:59:59",
                is_free: true,
                organizer_name: "ATU Alumni Association",
                organizer_email: "events@atu.edu.gh",
                organizer_phone: "+233 24 123 4567",
                tags: ["networking", "tech", "career"],
                requirements: "Bring your business cards and an open mind!",
                agenda: "6:00 PM - Registration\n6:30 PM - Welcome & Introductions\n7:00 PM - Networking Sessions\n8:30 PM - Panel Discussion\n9:00 PM - Close",
                speakers: JSON.stringify([
                    {
                        name: "Kwame Mensah",
                        title: "CTO, TechCorp Ghana",
                        bio: "20+ years experience in tech leadership",
                        photo: "https://i.pravatar.cc/150?img=12"
                    },
                    {
                        name: "Ama Asante",
                        title: "Founder, StartupHub",
                        bio: "Serial entrepreneur and tech innovator",
                        photo: "https://i.pravatar.cc/150?img=5"
                    }
                ]),
                is_featured: true
            },
            {
                title: "Career Development Workshop: Resume Writing",
                description: "Learn how to craft a compelling resume that gets you noticed by top employers. This hands-on workshop will cover modern resume formats, ATS optimization, and how to highlight your achievements effectively.",
                event_type: "Workshop",
                category: "Career",
                start_date: "2025-11-20 14:00:00",
                end_date: "2025-11-20 17:00:00",
                location: "Virtual",
                location_type: "Virtual",
                meeting_link: "https://zoom.us/j/123456789",
                event_image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
                capacity: 50,
                registration_deadline: "2025-11-19 23:59:59",
                is_free: true,
                organizer_name: "Career Services",
                organizer_email: "careers@atu.edu.gh",
                tags: ["career", "workshop", "professional development"],
                requirements: "Laptop required. Bring your current resume if you have one.",
                agenda: "2:00 PM - Introduction to Modern Resumes\n2:30 PM - Resume Structure & Formatting\n3:30 PM - Hands-on Practice\n4:30 PM - Q&A",
                speakers: JSON.stringify([
                    {
                        name: "Dr. Akosua Boateng",
                        title: "HR Director, MTN Ghana",
                        bio: "15 years in talent acquisition and HR",
                        photo: "https://i.pravatar.cc/150?img=47"
                    }
                ]),
                is_featured: true
            },
            {
                title: "Alumni Homecoming 2025",
                description: "Welcome back home! Join us for the annual Alumni Homecoming celebration. Reconnect with old friends, meet recent graduates, tour the new campus facilities, and enjoy a day of fun activities and memories.",
                event_type: "Reunion",
                category: "Social",
                start_date: "2025-12-05 10:00:00",
                end_date: "2025-12-05 18:00:00",
                location: "ATU Main Campus, Kumasi",
                location_type: "In-person",
                venue_name: "ATU Main Campus",
                event_image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
                capacity: 500,
                registration_deadline: "2025-12-01 23:59:59",
                is_free: false,
                ticket_price: 50.00,
                currency: "GHS",
                organizer_name: "Alumni Relations Office",
                organizer_email: "alumni@atu.edu.gh",
                organizer_phone: "+233 24 987 6543",
                tags: ["reunion", "social", "homecoming"],
                requirements: "Valid alumni ID or graduation certificate",
                agenda: "10:00 AM - Registration & Welcome Coffee\n11:00 AM - Campus Tour\n12:30 PM - Lunch\n2:00 PM - Class Reunions\n4:00 PM - Sports & Games\n6:00 PM - Gala Dinner",
                is_featured: true
            },
            {
                title: "Engineering Innovation Conference 2025",
                description: "A one-day conference showcasing the latest innovations in engineering from our alumni community. Features keynote speeches, panel discussions, and technical presentations on cutting-edge engineering solutions.",
                event_type: "Conference",
                category: "Academic",
                start_date: "2025-11-25 09:00:00",
                end_date: "2025-11-25 17:00:00",
                location: "Accra International Conference Centre",
                location_type: "Hybrid",
                venue_name: "Accra International Conference Centre",
                meeting_link: "https://zoom.us/j/987654321",
                event_image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800",
                capacity: 200,
                registration_deadline: "2025-11-22 23:59:59",
                is_free: false,
                ticket_price: 100.00,
                currency: "GHS",
                organizer_name: "Engineering Alumni Chapter",
                organizer_email: "engineering@atu.edu.gh",
                tags: ["engineering", "innovation", "conference", "technology"],
                requirements: "Engineering background preferred but not required",
                agenda: "9:00 AM - Registration\n9:30 AM - Opening Keynote\n10:30 AM - Technical Sessions\n12:30 PM - Lunch & Networking\n2:00 PM - Panel Discussions\n4:00 PM - Innovation Showcase\n5:00 PM - Closing Remarks",
                speakers: JSON.stringify([
                    {
                        name: "Eng. Kofi Agyeman",
                        title: "Principal Engineer, Ghana Grid Company",
                        bio: "Expert in renewable energy systems",
                        photo: "https://i.pravatar.cc/150?img=33"
                    },
                    {
                        name: "Dr. Efua Mensah",
                        title: "Research Lead, Tech Innovation Lab",
                        bio: "Published researcher in AI and robotics",
                        photo: "https://i.pravatar.cc/150?img=44"
                    }
                ]),
                is_featured: true
            },
            {
                title: "Fundraising Gala: Scholarship Fund",
                description: "Join us for an elegant evening to raise funds for student scholarships. Your contribution will help deserving students pursue their dreams at ATU. Includes dinner, entertainment, and silent auction.",
                event_type: "Fundraiser",
                category: "Social",
                start_date: "2025-12-15 19:00:00",
                end_date: "2025-12-15 23:00:00",
                location: "Movenpick Ambassador Hotel, Accra",
                location_type: "In-person",
                venue_name: "Movenpick Ambassador Hotel",
                event_image: "https://images.unsplash.com/photo-1519167758481-83f29da8fd83?w=800",
                capacity: 150,
                registration_deadline: "2025-12-10 23:59:59",
                is_free: false,
                ticket_price: 500.00,
                currency: "GHS",
                organizer_name: "Alumni Giving Committee",
                organizer_email: "giving@atu.edu.gh",
                organizer_phone: "+233 24 555 1234",
                tags: ["fundraiser", "gala", "charity", "scholarship"],
                requirements: "Formal attire required",
                agenda: "7:00 PM - Cocktail Reception\n8:00 PM - Dinner\n9:00 PM - Entertainment & Silent Auction\n10:30 PM - Live Auction\n11:00 PM - Close",
                benefits: "All proceeds go to student scholarships",
                is_featured: true
            },
            {
                title: "Entrepreneurship Masterclass: From Idea to Launch",
                description: "Learn from successful alumni entrepreneurs about turning your business idea into reality. This interactive webinar covers ideation, validation, funding, and launching your startup.",
                event_type: "Webinar",
                category: "Career",
                start_date: "2025-11-28 19:00:00",
                end_date: "2025-11-28 21:00:00",
                location: "Virtual",
                location_type: "Virtual",
                meeting_link: "https://zoom.us/j/456789123",
                event_image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
                capacity: 100,
                registration_deadline: "2025-11-27 23:59:59",
                is_free: true,
                organizer_name: "Entrepreneurship Hub",
                organizer_email: "entrepreneurship@atu.edu.gh",
                tags: ["entrepreneurship", "startup", "business", "webinar"],
                requirements: "Notepad for taking notes recommended",
                agenda: "7:00 PM - Welcome & Introduction\n7:15 PM - Finding Your Idea\n7:45 PM - Market Validation\n8:15 PM - Funding Options\n8:45 PM - Launch Strategy\n9:15 PM - Q&A",
                speakers: JSON.stringify([
                    {
                        name: "Yaw Boakye",
                        title: "CEO, PayTech Ghana",
                        bio: "Built and sold two successful startups",
                        photo: "https://i.pravatar.cc/150?img=68"
                    }
                ]),
                is_featured: false
            },
            {
                title: "Alumni Football Tournament",
                description: "Dust off your boots and join us for the annual Alumni Football Tournament! Form teams by graduation year and compete for the championship trophy. Family and friends welcome to cheer!",
                event_type: "Sports",
                category: "Sports",
                start_date: "2025-11-30 08:00:00",
                end_date: "2025-11-30 17:00:00",
                location: "ATU Sports Complex, Kumasi",
                location_type: "In-person",
                venue_name: "ATU Sports Complex",
                event_image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800",
                capacity: 300,
                registration_deadline: "2025-11-25 23:59:59",
                is_free: true,
                organizer_name: "Sports & Recreation",
                organizer_email: "sports@atu.edu.gh",
                tags: ["sports", "football", "tournament", "fitness"],
                requirements: "Sports attire and boots. Bring your own water bottle.",
                agenda: "8:00 AM - Registration & Team Photos\n9:00 AM - Opening Ceremony\n9:30 AM - Group Stage Matches\n12:00 PM - Lunch Break\n1:00 PM - Knockout Rounds\n4:00 PM - Finals\n5:00 PM - Awards Ceremony",
                is_featured: false
            },
            {
                title: "Women in Tech Panel Discussion",
                description: "Join successful women alumni in tech for an inspiring panel discussion about breaking barriers, career growth, and creating opportunities in the technology sector.",
                event_type: "Conference",
                category: "Career",
                start_date: "2025-12-08 15:00:00",
                end_date: "2025-12-08 17:30:00",
                location: "Impact Hub Accra",
                location_type: "Hybrid",
                venue_name: "Impact Hub Accra",
                meeting_link: "https://zoom.us/j/789123456",
                event_image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800",
                capacity: 80,
                registration_deadline: "2025-12-06 23:59:59",
                is_free: true,
                organizer_name: "Women in Tech Alumni Group",
                organizer_email: "womenintech@atu.edu.gh",
                tags: ["women in tech", "diversity", "career", "panel"],
                requirements: "Open to all genders",
                agenda: "3:00 PM - Welcome & Introductions\n3:15 PM - Panel Discussion\n4:15 PM - Q&A\n4:45 PM - Networking Session",
                speakers: JSON.stringify([
                    {
                        name: "Abena Osei",
                        title: "VP Engineering, Tech Solutions Ltd",
                        bio: "Leading engineering teams for 10+ years",
                        photo: "https://i.pravatar.cc/150?img=9"
                    },
                    {
                        name: "Adwoa Mensah",
                        title: "Data Science Director, FinTech Ghana",
                        bio: "Pioneer in AI and machine learning in Ghana",
                        photo: "https://i.pravatar.cc/150?img=20"
                    },
                    {
                        name: "Nana Akua Frimpong",
                        title: "Cybersecurity Consultant",
                        bio: "Expert in information security",
                        photo: "https://i.pravatar.cc/150?img=32"
                    }
                ]),
                is_featured: false
            }
        ];

        console.log("📝 Creating sample events...\n");

        for (const event of events) {
            const result = await pool.query(
                `INSERT INTO events (
                    created_by, title, description, event_type, category,
                    start_date, end_date, location, location_type, venue_name,
                    meeting_link, event_image, capacity, registration_deadline,
                    is_free, ticket_price, currency, organizer_name, organizer_email,
                    organizer_phone, tags, requirements, agenda, speakers, is_featured
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
                RETURNING id, title, event_type`,
                [
                    adminId,
                    event.title,
                    event.description,
                    event.event_type,
                    event.category,
                    event.start_date,
                    event.end_date,
                    event.location,
                    event.location_type,
                    event.venue_name || null,
                    event.meeting_link || null,
                    event.event_image || null,
                    event.capacity,
                    event.registration_deadline,
                    event.is_free,
                    event.ticket_price || null,
                    event.currency || 'GHS',
                    event.organizer_name,
                    event.organizer_email,
                    event.organizer_phone || null,
                    event.tags,
                    event.requirements || null,
                    event.agenda || null,
                    event.speakers || null,
                    event.is_featured
                ]
            );

            console.log(`✅ Created: ${result.rows[0].title} (${result.rows[0].event_type})`);
        }

        console.log("\n✅ Events data seeded successfully!");
        console.log(`\n📊 Summary:`);
        console.log(`   - Events created: ${events.length}`);
        console.log(`   - Created by admin ID: ${adminId}`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedEventsData();