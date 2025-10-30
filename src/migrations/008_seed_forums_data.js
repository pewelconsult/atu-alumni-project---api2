// src/migrations/008_seed_forums_data.js
import pool from "../config/db.js";

const seedForumsData = async () => {
    try {
        console.log("🌱 Starting forums data seeding...\n");

        // Get admin and alumni users
        const usersResult = await pool.query(
            "SELECT id, role FROM users WHERE is_active = true ORDER BY id LIMIT 5"
        );

        if (usersResult.rows.length === 0) {
            console.log("❌ No users found. Please create users first.");
            process.exit(1);
        }

        const users = usersResult.rows;
        const adminId = users.find(u => u.role === 'admin')?.id || users[0].id;
        const alumniIds = users.filter(u => u.role === 'alumni').map(u => u.id);

        console.log(`✅ Using admin (ID: ${adminId})`);
        console.log(`✅ Found ${alumniIds.length} alumni users\n`);

        // ==================== CATEGORIES ====================

        console.log("📚 Creating forum categories...\n");

        const categories = [
            {
                name: "Academic Discussions",
                slug: "academic-discussions",
                description: "Share knowledge, ask questions about courses, research, and academic topics.",
                icon: "📚",
                color: "#3B82F6",
                order_position: 1
            },
            {
                name: "Career & Professional Development",
                slug: "career-professional-development",
                description: "Career advice, job search tips, interview experiences, and professional growth.",
                icon: "💼",
                color: "#10B981",
                order_position: 2
            },
            {
                name: "Networking & Connections",
                slug: "networking-connections",
                description: "Connect with fellow alumni, find mentors, and build your professional network.",
                icon: "🤝",
                color: "#8B5CF6",
                order_position: 3
            },
            {
                name: "Alumni News & Updates",
                slug: "alumni-news-updates",
                description: "Latest news, announcements, and updates from the ATU alumni community.",
                icon: "🎓",
                color: "#F59E0B",
                order_position: 4
            },
            {
                name: "Entrepreneurship & Startups",
                slug: "entrepreneurship-startups",
                description: "Share startup ideas, get feedback, discuss entrepreneurship challenges and opportunities.",
                icon: "💡",
                color: "#EF4444",
                order_position: 5
            },
            {
                name: "Tech & Innovation",
                slug: "tech-innovation",
                description: "Discuss the latest technologies, programming, software development, and tech trends.",
                icon: "🛠️",
                color: "#06B6D4",
                order_position: 6
            },
            {
                name: "Social & Events",
                slug: "social-events",
                description: "Plan meetups, discuss social events, and connect on a personal level.",
                icon: "🎉",
                color: "#EC4899",
                order_position: 7
            },
            {
                name: "General Q&A",
                slug: "general-qa",
                description: "Ask any questions, share opinions, and have general discussions.",
                icon: "❓",
                color: "#6B7280",
                order_position: 8
            }
        ];

        const categoryIds = {};

        for (const category of categories) {
            const result = await pool.query(
                `INSERT INTO forum_categories (name, slug, description, icon, color, order_position)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, name`,
                [category.name, category.slug, category.description, category.icon, category.color, category.order_position]
            );

            categoryIds[category.slug] = result.rows[0].id;
            console.log(`✅ Created category: ${result.rows[0].name}`);
        }

        console.log("\n✅ All categories created successfully!\n");

        // ==================== POSTS ====================

        console.log("📝 Creating forum posts...\n");

        const posts = [
            {
                category: "career-professional-development",
                user_id: alumniIds[0] || adminId,
                title: "How to transition from engineering to product management?",
                slug: "transition-engineering-to-product-management",
                content: `I've been working as a software engineer for 5 years and I'm interested in transitioning to a product management role. 

I have a strong technical background but limited experience in product strategy, user research, and stakeholder management. 

Has anyone here made a similar transition? What skills should I focus on developing? Are there any courses or certifications you'd recommend?

Any advice would be greatly appreciated!`,
                tags: ["career change", "product management", "engineering", "advice"]
            },
            {
                category: "tech-innovation",
                user_id: alumniIds[1] || adminId,
                title: "Best practices for implementing microservices architecture",
                slug: "microservices-architecture-best-practices",
                content: `Our team is planning to migrate from a monolithic architecture to microservices. I'd love to hear from anyone who has gone through this process.

Some questions I have:
- What are the biggest challenges you faced?
- How did you handle data consistency across services?
- What tools did you use for service orchestration?
- How did you manage the increased operational complexity?

Looking forward to learning from your experiences!`,
                tags: ["microservices", "architecture", "software development", "devops"]
            },
            {
                category: "entrepreneurship-startups",
                user_id: alumniIds[2] || adminId,
                title: "Looking for co-founder for EdTech startup",
                slug: "looking-cofounder-edtech-startup",
                content: `Hi everyone! I'm working on an EdTech startup focused on making quality education accessible to students in Ghana. We're building an AI-powered learning platform that adapts to each student's pace and learning style.

I'm looking for a technical co-founder who:
- Has experience in web/mobile development
- Is passionate about education
- Can commit 20+ hours per week initially
- Based in Accra (preferred but not required)

We already have:
- Initial market research
- Beta version of the platform
- Interest from 3 schools for pilot program

If you're interested or know someone who might be, please reach out!`,
                tags: ["cofounder", "edtech", "startup", "opportunity"]
            },
            {
                category: "academic-discussions",
                user_id: alumniIds[0] || adminId,
                title: "Best resources for learning machine learning and AI?",
                slug: "machine-learning-ai-resources",
                content: `I want to transition into AI/ML field and I'm looking for comprehensive learning resources. 

I have a solid foundation in programming (Python, JavaScript) and basic statistics, but I'm new to machine learning concepts.

What courses, books, or online resources would you recommend for:
1. Understanding ML fundamentals
2. Deep learning and neural networks
3. Practical implementation and projects
4. Staying updated with latest research

Also, how important is a Master's degree for breaking into this field?

Thanks in advance!`,
                tags: ["machine learning", "AI", "learning resources", "career"]
            },
            {
                category: "networking-connections",
                user_id: alumniIds[1] || adminId,
                title: "Alumni working in renewable energy sector?",
                slug: "alumni-renewable-energy-sector",
                content: `I'm passionate about renewable energy and climate change solutions. I recently completed my degree in Electrical Engineering and I'm looking to connect with alumni working in this sector.

Would love to learn about:
- Career paths in renewable energy
- Companies/organizations in Ghana and abroad
- Skills that are most valuable
- Opportunities for recent graduates

If you're working in solar, wind, hydro, or any other renewable energy field, I'd appreciate the chance to connect and learn from your experience!`,
                tags: ["networking", "renewable energy", "career", "mentorship"]
            },
            {
                category: "career-professional-development",
                user_id: alumniIds[2] || adminId,
                title: "Interview experiences at top tech companies",
                slug: "interview-experiences-tech-companies",
                content: `I have upcoming interviews with some major tech companies (Google, Microsoft, and Amazon) and I'd love to hear about your experiences!

Specifically interested in:
- Technical interview preparation strategies
- Common coding problems/patterns
- System design interview tips
- Behavioral interview questions
- How to negotiate compensation

Any insights, tips, or resources you can share would be incredibly helpful. Also happy to share my experience once I'm done!`,
                tags: ["interviews", "tech companies", "career", "preparation"]
            },
            {
                category: "social-events",
                user_id: alumniIds[0] || adminId,
                title: "Monthly Alumni Meetup - November 2025 (Accra)",
                slug: "monthly-alumni-meetup-november-2025",
                content: `Hey everyone! Let's organize our monthly alumni meetup for November.

Proposed Details:
- Date: Saturday, November 16, 2025
- Time: 4:00 PM - 8:00 PM
- Location: SkyBar 25, Accra (tentative)
- Activities: Networking, dinner, drinks

This is a great opportunity to:
- Reconnect with old friends
- Make new connections
- Share experiences
- Just have fun!

Please comment below if you're interested and suggest any location changes. Once we have a headcount, I'll make a reservation.

Looking forward to seeing you all! 🎉`,
                tags: ["meetup", "social", "networking", "accra"]
            },
            {
                category: "entrepreneurship-startups",
                user_id: alumniIds[1] || adminId,
                title: "How to validate your startup idea before building?",
                slug: "validate-startup-idea-before-building",
                content: `I have a startup idea that I'm excited about, but I want to make sure there's actual demand before investing time and money into building it.

What are the best ways to validate a startup idea? I've heard about:
- Customer interviews
- Landing pages with email signup
- MVP with limited features
- Social media campaigns

Which approach worked best for you? How many potential customers should you talk to before feeling confident?

Also, how do you balance between talking to customers and actually building the product?

Would love to hear your validation stories - both successes and failures!`,
                tags: ["startup validation", "entrepreneurship", "mvp", "customer research"]
            },
            {
                category: "tech-innovation",
                user_id: alumniIds[2] || adminId,
                title: "Web3 and Blockchain opportunities in Ghana",
                slug: "web3-blockchain-opportunities-ghana",
                content: `There's a lot of buzz around Web3, blockchain, and cryptocurrency. I'm curious about the real opportunities in this space, especially within Ghana and West Africa.

Questions:
- Are there legitimate blockchain use cases beyond cryptocurrency?
- What companies/startups in Ghana are working on blockchain?
- Is it worth learning Solidity and smart contract development?
- How can we leverage blockchain for solving African problems?

I'm trying to separate the hype from real opportunities. Would appreciate perspectives from anyone working in or familiar with this space.`,
                tags: ["blockchain", "web3", "cryptocurrency", "ghana", "africa"]
            },
            {
                category: "general-qa",
                user_id: alumniIds[0] || adminId,
                title: "Best coworking spaces in Accra?",
                slug: "best-coworking-spaces-accra",
                content: `I'm currently working remotely and looking for a good coworking space in Accra with:
- Reliable high-speed internet
- Quiet work environment
- Meeting rooms
- Coffee/refreshments
- Reasonable pricing

I've heard about Impact Hub, SSNIT Emporium, and a few others. What are your recommendations?

Also interested in knowing:
- Average monthly costs
- Parking availability
- Networking opportunities
- Overall vibe

Thanks for any suggestions!`,
                tags: ["coworking", "remote work", "accra", "workspace"]
            },
            {
                category: "alumni-news-updates",
                user_id: adminId,
                title: "ATU Alumni Network Platform Launch!",
                slug: "atu-alumni-network-platform-launch",
                content: `We're excited to announce the official launch of the ATU Alumni Network Platform! 🎉

This platform is designed to help our alumni community:
- Stay connected with fellow graduates
- Find job opportunities
- Attend and organize events
- Share knowledge and experiences
- Mentor current students

Key Features:
✅ Job Board with opportunities from top companies
✅ Events calendar and RSVP system
✅ Discussion forums (you're here!)
✅ Alumni directory and networking
✅ News and updates

We've built this platform based on feedback from hundreds of alumni. This is just the beginning - we have many more features planned!

Please explore, provide feedback, and help us build a stronger alumni community. Together, we can create lasting impact!

Welcome home! 🎓`,
                tags: ["announcement", "platform launch", "alumni network"],
                is_pinned: true
            },
            {
                category: "career-professional-development",
                user_id: alumniIds[1] || adminId,
                title: "Salary negotiation tips for new graduates",
                slug: "salary-negotiation-tips-new-graduates",
                content: `Just received my first job offer and I'm nervous about salary negotiations. The offer seems fair, but I've heard you should always negotiate.

For those with experience:
- Is it appropriate to negotiate your first salary?
- How much can you typically negotiate (percentage-wise)?
- What's the best way to approach the conversation?
- Besides salary, what other benefits should I negotiate for?
- What if they say "this is our final offer"?

The role is for a software developer position in Accra. Any advice would be really helpful as I need to respond by next week!`,
                tags: ["salary negotiation", "new graduate", "career advice", "compensation"]
            }
        ];

        const postIds = [];

        for (const post of posts) {
            const categoryId = categoryIds[post.category];
            
            const result = await pool.query(
                `INSERT INTO forum_posts (
                    category_id, user_id, title, content, slug, tags, is_pinned
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, title`,
                [
                    categoryId,
                    post.user_id,
                    post.title,
                    post.content,
                    post.slug,
                    post.tags,
                    post.is_pinned || false
                ]
            );

            postIds.push(result.rows[0].id);
            console.log(`✅ Created post: ${result.rows[0].title}`);
        }

        console.log("\n✅ All posts created successfully!\n");

        // ==================== REPLIES ====================

        console.log("💬 Creating forum replies...\n");

        const replies = [
            // Replies to "How to transition from engineering to product management?"
            {
                post_index: 0,
                user_id: alumniIds[1] || adminId,
                content: `I made this exact transition 3 years ago! Here's what worked for me:

1. **Build product skills while still engineering**: Start by working closely with your PM. Understand how they think, what frameworks they use, and how they prioritize features.

2. **Take ownership of product decisions**: When working on features, don't just code - think about the "why". Question requirements, suggest improvements.

3. **Courses I recommend**:
   - Product School's Product Management course
   - Reforge's Product Strategy program
   - Read "Inspired" by Marty Cagan

4. **Side projects**: Build something and manage it like a PM would. Do user research, create roadmaps, measure metrics.

The technical background is actually a huge advantage in product management! Happy to chat more if you want to connect.`
            },
            {
                post_index: 0,
                user_id: alumniIds[2] || adminId,
                content: `Great advice above! I'll add that you should also focus on:

- **Communication skills**: PMs need to explain technical concepts to non-technical stakeholders
- **Data analysis**: Learn SQL and basic data analysis - you'll need it for making data-driven decisions
- **User empathy**: Start doing user interviews, even informally

Also, look for "Associate PM" or "Technical PM" roles as stepping stones. They're designed for people with your background!`
            },
            // Replies to "Best practices for implementing microservices"
            {
                post_index: 1,
                user_id: alumniIds[0] || adminId,
                content: `We went through this migration last year. Biggest lessons:

**Don't migrate everything at once!** Start with one or two services that are:
- Relatively independent
- Have clear boundaries
- Not critical to core business

**Data consistency** was our biggest challenge. We ended up using:
- Event sourcing for some services
- Saga pattern for distributed transactions
- Eventually consistent approach where possible

**Tools we used**:
- Docker & Kubernetes for orchestration
- Kong for API Gateway
- Prometheus & Grafana for monitoring
- ELK stack for logging

The operational complexity is real - make sure your team is ready for it!`
            },
            {
                post_index: 1,
                user_id: adminId,
                content: `One thing to add: **Don't underestimate the importance of organizational structure.**

Conway's Law is real - your architecture will mirror your team structure. Make sure you have autonomous teams that can own their services end-to-end.

Also invest heavily in observability from day one. Distributed systems are hard to debug!`
            },
            // Reply to "Looking for co-founder"
            {
                post_index: 2,
                user_id: alumniIds[0] || adminId,
                content: `This sounds like an interesting opportunity! I have 6 years of experience in full-stack development (React, Node.js, React Native) and I'm passionate about education.

I'm currently working full-time but could potentially commit 15-20 hours per week initially, with plans to go full-time if things go well.

Would love to learn more about:
- Your vision for the platform
- Current tech stack
- Business model
- Timeline and funding plans

Let's schedule a call to discuss further!`
            },
            // Replies to "Best resources for learning ML/AI"
            {
                post_index: 3,
                user_id: alumniIds[1] || adminId,
                content: `For ML fundamentals, start with:

1. **Andrew Ng's Machine Learning course** (Coursera) - The best introduction, period.
2. **Fast.ai's Practical Deep Learning** - Great for hands-on learning
3. **Hands-On Machine Learning with Scikit-Learn** (book) - Excellent practical resource

For staying updated:
- Papers With Code
- Two Minute Papers (YouTube)
- Arxiv Sanity Preserver

As for Master's degree - it helps but isn't absolutely necessary. Focus on building a strong portfolio of projects. Many people break into ML with just online courses + solid projects.

Start with a real problem you care about and build something to solve it!`
            },
            {
                post_index: 3,
                user_id: alumniIds[2] || adminId,
                content: `I'd also add:

**Math foundation is important!**
- Linear Algebra (3Blue1Brown on YouTube)
- Probability & Statistics
- Calculus basics

**Kaggle competitions** are great for:
- Practical experience
- Learning from others' solutions
- Building your portfolio

And yes, you can definitely break into ML without a Master's. I did it with:
- Online courses
- 5 solid projects on GitHub
- Contributing to open source ML libraries
- Writing technical blog posts

Good luck! 🚀`,
                is_solution: true
            },
            // Reply to "Alumni in renewable energy"
            {
                post_index: 4,
                user_id: alumniIds[0] || adminId,
                content: `I've been working in the solar energy sector for 4 years now! Currently at a company that designs and installs solar systems for commercial buildings.

**Career paths:**
- Solar design engineer
- Energy analyst
- Project manager for renewable installations
- Energy policy and regulation
- Research and development

**Key skills:**
- AutoCAD/PVsyst for solar design
- Energy modeling software
- Project management
- Understanding of energy regulations

**Companies in Ghana:**
Several! Including:
- Wigal Ltd
- Solar Taxi
- Sunshine Solar Ltd
- Plus many more startups

Happy to connect and share more insights. The renewable energy sector in Ghana is growing rapidly!`
            },
            // Replies to "Interview experiences"
            {
                post_index: 5,
                user_id: alumniIds[1] || adminId,
                content: `I interviewed with all three last year. Got offers from Google and Microsoft!

**Technical prep:**
- LeetCode: Focus on medium problems, some hard
- Master these patterns: Two pointers, Sliding window, DFS/BFS, Dynamic Programming
- Practice explaining your thought process out loud
- Time yourself!

**System Design:**
- Grokking the System Design Interview (Educative.io)
- Practice with friends/mock interviews
- Focus on: Scaling, CAP theorem, Load balancing, Caching

**Behavioral:**
- Use STAR method (Situation, Task, Action, Result)
- Prepare stories for: Leadership, Conflict, Failure, Success
- Be ready to explain gaps in resume

**Google specific:** Googleyness matters. Show you're collaborative and can handle ambiguity.

**Negotiation:** Always negotiate! I got my offer increased by 15% just by asking.

Good luck! You've got this! 💪`
            },
            // Reply to meetup post
            {
                post_index: 6,
                user_id: alumniIds[2] || adminId,
                content: `Count me in! Saturday works perfectly. SkyBar 25 is a great choice - nice ambiance and central location.

I'll bring along a classmate from 2019 batch who's also interested in reconnecting with alumni.

See you there! 🎉`
            },
            {
                post_index: 6,
                user_id: alumniIds[0] || adminId,
                content: `I'm interested but Saturday might be tight for me. Would there be flexibility to do Sunday instead? Or we could do the next weekend?`
            },
            // Reply to startup validation
            {
                post_index: 7,
                user_id: alumniIds[0] || adminId,
                content: `Validation is crucial! Here's what worked for me:

**Phase 1: Customer interviews (Weeks 1-2)**
- Talk to 30-50 potential customers
- Ask about their problems, NOT your solution
- Look for patterns in pain points
- Validate they'd PAY for a solution

**Phase 2: Landing page (Week 3)**
- Create simple landing page explaining the solution
- Drive traffic via ads/social media
- Email signup as commitment indicator
- Aim for 10-15% conversion rate

**Phase 3: Smoke test (Week 4)**
- Add "Pre-order now" button
- See how many actually try to buy
- This separates real interest from "yeah, sounds cool"

**Phase 4: MVP (Weeks 5-8)**
- Build minimum viable version
- Only core features
- Get it in customers' hands ASAP

I talked to 42 people before building anything. 32 said they'd use it, but only 8 pre-ordered. Built for those 8 first!

The key: Fall in love with the problem, not your solution.`
            },
            // Reply to Web3/Blockchain post
            {
                post_index: 8,
                user_id: alumniIds[1] || adminId,
                content: `I'm working in the blockchain space. Here's my honest take:

**Real use cases beyond crypto:**
- Supply chain transparency (tracking products from source to consumer)
- Digital identity and credentials
- Land registry and property rights
- Cross-border payments (huge in Africa!)

**In Ghana:**
- BitSika (crypto exchange)
- AfriBlocks (freelancing platform using blockchain)
- Several pilots for land registry using blockchain

**My advice:**
Don't learn it just because it's trendy. Learn it if:
- You see a real problem it solves better than alternatives
- You're interested in distributed systems
- You want to work for Web3 companies

**Reality check:**
90% of blockchain projects could be solved with regular databases. But for the 10% where it makes sense, it's powerful.

Focus on understanding the fundamentals first: cryptography, distributed systems, consensus mechanisms.`
            },
            // Reply to coworking spaces
            {
                post_index: 9,
                user_id: alumniIds[2] || adminId,
                content: `I've worked at several! Here's my breakdown:

**Impact Hub Accra** (My favorite)
- Monthly: ~GHS 800-1200
- Excellent WiFi (very reliable)
- Great community and events
- Coffee/tea included
- Parking available
- Rating: 9/10

**SSNIT Emporium**
- Monthly: ~GHS 500-800
- Good WiFi most of the time
- More corporate environment
- Free parking
- Rating: 7/10

**Regus**
- Monthly: GHS 1000+
- Professional setup
- Great for client meetings
- Limited parking
- Rating: 8/10

I'd say try Impact Hub first. The community alone makes it worth it!`
            }
        ];

        for (const reply of replies) {
            const postId = postIds[reply.post_index];
            
            await pool.query(
                `INSERT INTO forum_replies (post_id, user_id, content, is_solution)
                 VALUES ($1, $2, $3, $4)`,
                [postId, reply.user_id, reply.content, reply.is_solution || false]
            );

            console.log(`✅ Created reply for post ID: ${postId}`);
        }

        console.log("\n✅ All replies created successfully!\n");

        // ==================== POST LIKES ====================

        console.log("👍 Adding some post likes...\n");

        // Add likes to first few posts
        for (let i = 0; i < Math.min(5, postIds.length); i++) {
            const postId = postIds[i];
            const numLikes = Math.floor(Math.random() * 10) + 5; // 5-15 likes

            for (let j = 0; j < Math.min(numLikes, alumniIds.length); j++) {
                try {
                    await pool.query(
                        `INSERT INTO forum_post_likes (post_id, user_id)
                         VALUES ($1, $2)
                         ON CONFLICT DO NOTHING`,
                        [postId, alumniIds[j] || adminId]
                    );
                } catch (error) {
                    // Ignore duplicate errors
                }
            }
        }

        console.log("✅ Post likes added!\n");

        // ==================== VIEWS ====================

        console.log("👁️ Adding view counts...\n");

        for (const postId of postIds) {
            const viewCount = Math.floor(Math.random() * 100) + 20; // 20-120 views
            await pool.query(
                "UPDATE forum_posts SET views_count = $1 WHERE id = $2",
                [viewCount, postId]
            );
        }

        console.log("✅ View counts added!\n");

        // ==================== SUMMARY ====================

        console.log("============================================");
        console.log("✅ Forums data seeded successfully!");
        console.log("============================================\n");

        console.log("📊 Summary:");
        console.log(`   - Categories created: ${categories.length}`);
        console.log(`   - Posts created: ${posts.length}`);
        console.log(`   - Replies created: ${replies.length}`);
        console.log(`   - Likes added: Multiple across posts`);
        console.log(`   - Views added: Random counts for engagement\n`);

        // Show final statistics
        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM forum_categories WHERE is_active = true) as categories,
                (SELECT COUNT(*) FROM forum_posts WHERE is_published = true) as posts,
                (SELECT COUNT(*) FROM forum_replies WHERE is_deleted = false) as replies,
                (SELECT SUM(views_count) FROM forum_posts) as total_views,
                (SELECT SUM(likes_count) FROM forum_posts) as total_likes
        `);

        console.log("📈 Forum Statistics:");
        console.table(statsResult.rows[0]);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedForumsData();