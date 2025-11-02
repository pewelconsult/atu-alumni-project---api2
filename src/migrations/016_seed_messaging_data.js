// src/migrations/016_seed_messaging_data.js
import pool from "../config/db.js";

const seedMessagingData = async () => {
    try {
        console.log("🌱 Starting messaging data seeding...\n");

        // Get active users
        const usersResult = await pool.query(`
            SELECT id, first_name, last_name 
            FROM users 
            WHERE is_active = true 
            ORDER BY id 
            LIMIT 10
        `);

        if (usersResult.rows.length < 2) {
            console.log("❌ Need at least 2 users to create conversations.");
            process.exit(1);
        }

        const users = usersResult.rows;
        console.log(`✅ Found ${users.length} users\n`);

        // ==================== CREATE CONVERSATIONS ====================
        console.log("💬 Creating conversations...\n");

        const conversations = [
            { user1_id: users[0].id, user2_id: users[1].id },
            { user1_id: users[0].id, user2_id: users[2].id },
            { user1_id: users[1].id, user2_id: users[2].id },
            { user1_id: users[0].id, user2_id: users[3].id },
            { user1_id: users[2].id, user2_id: users[3].id }
        ];

        const conversationIds = [];

        for (const conv of conversations) {
            // Ensure user1_id < user2_id
            const [smallerId, largerId] = conv.user1_id < conv.user2_id 
                ? [conv.user1_id, conv.user2_id]
                : [conv.user2_id, conv.user1_id];

            try {
                const result = await pool.query(
                    `INSERT INTO conversations (user1_id, user2_id)
                     VALUES ($1, $2)
                     ON CONFLICT (user1_id, user2_id) DO UPDATE 
                     SET updated_at = CURRENT_TIMESTAMP
                     RETURNING id`,
                    [smallerId, largerId]
                );
                conversationIds.push(result.rows[0].id);
                console.log(`✅ Created conversation between User ${smallerId} and User ${largerId}`);
            } catch (error) {
                console.error(`❌ Error creating conversation:`, error.message);
            }
        }

        // ==================== CREATE MESSAGES ====================
        console.log("\n📨 Creating messages...\n");

        const messageTemplates = [
            {
                conv_index: 0,
                messages: [
                    { sender_offset: 0, text: "Hi! How are you doing? It's been a while since we last spoke.", created_hours_ago: 48 },
                    { sender_offset: 1, text: "Hey! I'm doing great, thanks for asking! How about you?", created_hours_ago: 47 },
                    { sender_offset: 0, text: "I'm good too! I saw your post about the alumni meetup. Are you going?", created_hours_ago: 46 },
                    { sender_offset: 1, text: "Yes, definitely! It should be fun. Will you be there?", created_hours_ago: 45 },
                    { sender_offset: 0, text: "Absolutely! Looking forward to catching up with everyone.", created_hours_ago: 44 }
                ]
            },
            {
                conv_index: 1,
                messages: [
                    { sender_offset: 0, text: "Hey, do you have the notes from the networking event last month?", created_hours_ago: 24 },
                    { sender_offset: 1, text: "Yes! Let me find them and send them over to you.", created_hours_ago: 23 },
                    { sender_offset: 0, text: "Thanks! That would be really helpful.", created_hours_ago: 22 },
                    { sender_offset: 1, text: "Here you go! Hope these help. Let me know if you need anything else.", created_hours_ago: 21 }
                ]
            },
            {
                conv_index: 2,
                messages: [
                    { sender_offset: 0, text: "Congratulations on your new job! I saw your LinkedIn update.", created_hours_ago: 12 },
                    { sender_offset: 1, text: "Thank you so much! I'm really excited about this opportunity.", created_hours_ago: 11 },
                    { sender_offset: 0, text: "You deserve it! You worked so hard during our time at ATU.", created_hours_ago: 10 },
                    { sender_offset: 1, text: "Thanks! ATU really prepared me well for this role.", created_hours_ago: 9 }
                ]
            },
            {
                conv_index: 3,
                messages: [
                    { sender_offset: 0, text: "Are you attending the career fair next week?", created_hours_ago: 6 },
                    { sender_offset: 1, text: "I'm thinking about it. Are you going?", created_hours_ago: 5 },
                    { sender_offset: 0, text: "Yes! My company will have a booth there. We're hiring!", created_hours_ago: 4 },
                    { sender_offset: 1, text: "Oh really? That's perfect! What positions are you looking for?", created_hours_ago: 3 },
                    { sender_offset: 0, text: "We need software engineers and data analysts. Send me your CV!", created_hours_ago: 2 },
                    { sender_offset: 1, text: "Will do! Thanks for letting me know. 😊", created_hours_ago: 1 }
                ]
            },
            {
                conv_index: 4,
                messages: [
                    { sender_offset: 0, text: "Did you hear about the new scholarship program for ATU alumni?", created_hours_ago: 8 },
                    { sender_offset: 1, text: "No! Tell me more about it.", created_hours_ago: 7 },
                    { sender_offset: 0, text: "It's for postgraduate studies. The deadline is next month.", created_hours_ago: 6 },
                    { sender_offset: 1, text: "That sounds amazing! Where can I find more information?", created_hours_ago: 5 },
                    { sender_offset: 0, text: "Check the alumni portal. There's a detailed announcement there.", created_hours_ago: 4 }
                ]
            }
        ];

        let totalMessages = 0;

        for (const template of messageTemplates) {
            if (template.conv_index >= conversationIds.length) continue;

            const conversationId = conversationIds[template.conv_index];
            const conversation = conversations[template.conv_index];

            for (const msg of template.messages) {
                const senderId = msg.sender_offset === 0 ? conversation.user1_id : conversation.user2_id;
                const createdAt = new Date(Date.now() - (msg.created_hours_ago * 60 * 60 * 1000));

                try {
                    await pool.query(
                        `INSERT INTO messages (conversation_id, sender_id, message_text, created_at, is_read)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [conversationId, senderId, msg.text, createdAt, msg.created_hours_ago > 5]
                    );
                    totalMessages++;
                } catch (error) {
                    console.error(`❌ Error creating message:`, error.message);
                }
            }

            console.log(`✅ Created ${template.messages.length} messages for conversation ${template.conv_index + 1}`);
        }

        // ==================== CREATE MESSAGE REACTIONS ====================
        console.log("\n❤️  Creating message reactions...\n");

        // Get some messages to react to
        const messagesToReact = await pool.query(`
            SELECT id, conversation_id, sender_id
            FROM messages
            ORDER BY created_at DESC
            LIMIT 10
        `);

        const reactions = ['like', 'love', 'haha', 'wow'];
        let reactionCount = 0;

        for (const message of messagesToReact.rows) {
            // Get the other user in the conversation
            const convResult = await pool.query(
                `SELECT user1_id, user2_id FROM conversations WHERE id = $1`,
                [message.conversation_id]
            );

            if (convResult.rows.length > 0) {
                const conv = convResult.rows[0];
                const reactorId = message.sender_id === conv.user1_id ? conv.user2_id : conv.user1_id;
                const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];

                try {
                    await pool.query(
                        `INSERT INTO message_reactions (message_id, user_id, reaction_type)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (message_id, user_id) DO NOTHING`,
                        [message.id, reactorId, randomReaction]
                    );
                    reactionCount++;
                } catch (error) {
                    console.error(`❌ Error creating reaction:`, error.message);
                }
            }
        }

        console.log(`✅ Created ${reactionCount} message reactions\n`);

        // ==================== SUMMARY ====================
        console.log("============================================");
        console.log("✅ Messaging data seeded successfully!");
        console.log("============================================\n");

        console.log("📊 Summary:");
        console.log(`   - Conversations: ${conversationIds.length}`);
        console.log(`   - Messages: ${totalMessages}`);
        console.log(`   - Reactions: ${reactionCount}\n`);

        // Show statistics
        const stats = await pool.query(`
            SELECT * FROM v_message_stats
        `);

        console.log("📈 Message Statistics:");
        console.table(stats.rows[0]);

        // Show sample conversations
        const sampleConvs = await pool.query(`
            SELECT 
                c.id,
                u1.first_name || ' ' || u1.last_name as user1,
                u2.first_name || ' ' || u2.last_name as user2,
                COUNT(m.id) as message_count,
                c.last_message_preview
            FROM conversations c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            LEFT JOIN messages m ON c.id = m.conversation_id
            GROUP BY c.id, u1.first_name, u1.last_name, u2.first_name, u2.last_name, c.last_message_preview
            ORDER BY c.last_message_at DESC
            LIMIT 5
        `);

        console.log("\n💬 Sample Conversations:");
        console.table(sampleConvs.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedMessagingData();