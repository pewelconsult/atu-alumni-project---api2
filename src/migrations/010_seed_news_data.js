// src/migrations/010_seed_news_data.js
import pool from "../config/db.js";

const seedNewsData = async () => {
    try {
        console.log("🌱 Starting news data seeding...\n");

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

        // Get alumni users for comments
        const alumniResult = await pool.query(
            "SELECT id FROM users WHERE role = 'alumni' AND is_active = true LIMIT 5"
        );

        const alumniIds = alumniResult.rows.map(u => u.id);
        console.log(`✅ Found ${alumniIds.length} alumni users for comments\n`);

        // Sample news articles
        const articles = [
            {
                title: "ATU Alumni Network Platform Officially Launches",
                slug: "atu-alumni-network-platform-launch",
                excerpt: "We are thrilled to announce the official launch of the ATU Alumni Network Platform, a comprehensive digital hub designed to connect, engage, and empower our growing alumni community.",
                content: `Today marks a significant milestone in our journey as we officially launch the ATU Alumni Network Platform!

**What is the Alumni Network Platform?**

The ATU Alumni Network is a comprehensive digital ecosystem designed specifically for our alumni community. It serves as a central hub where graduates can stay connected, advance their careers, give back, and maintain lifelong relationships with their alma mater and fellow alumni.

**Key Features:**

**1. Career Opportunities**
Our integrated job board features exclusive opportunities from top employers actively seeking ATU graduates. Whether you're looking for your next career move or hiring talent, this is your go-to resource.

**2. Events & Networking**
Stay informed about upcoming alumni events, reunions, professional development workshops, and networking sessions. RSVP, invite colleagues, and never miss an opportunity to connect.

**3. Discussion Forums**
Engage in meaningful conversations with fellow alumni. Share insights, seek advice, discuss industry trends, and build your professional network through our vibrant community forums.

**4. News & Updates**
Stay current with the latest news from ATU, alumni achievements, industry insights, and important announcements that matter to you.

**Why We Built This**

After extensive conversations with hundreds of alumni, we identified a clear need for a centralized platform that would:
- Strengthen connections between alumni across different graduation years
- Provide career support and professional development opportunities
- Create a space for knowledge sharing and mentorship
- Keep everyone informed about university developments and alumni achievements
- Foster a sense of belonging and community pride

**What's Next?**

This launch is just the beginning. We have exciting features planned for the coming months:
- Mentorship program matching
- Alumni directory with advanced search
- Mobile applications for iOS and Android
- Integration with LinkedIn for professional networking
- Virtual event capabilities
- Alumni giving portal

**Get Involved**

We encourage all alumni to:
1. Create or update your profile
2. Explore the job board and events calendar
3. Join discussions in the forums
4. Share the platform with fellow graduates
5. Provide feedback to help us improve

**Thank You**

This platform is the result of countless hours of work by dedicated staff, input from alumni focus groups, and support from university leadership. Special thanks to our development team and all the alumni who provided valuable feedback during our beta testing phase.

Welcome home, ATU alumni! Let's build something amazing together.

For questions or support, contact us at support@atu-alumni.edu.gh`,
                featured_image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
                category: "Alumni",
                tags: ["platform launch", "alumni network", "announcement", "technology"],
                is_featured: true
            },
            {
                title: "ATU Graduates Excel in 2025 Tech Industry Rankings",
                slug: "atu-graduates-excel-2025-tech-rankings",
                excerpt: "ATU alumni continue to make significant impact in the technology sector, with several graduates securing leadership positions at major tech companies across Africa and beyond.",
                content: `Recent industry reports highlight the remarkable achievements of ATU graduates in the technology sector throughout 2025.

**Notable Achievements:**

**Leadership Positions**
ATU alumni now hold senior positions at leading tech companies including:
- 3 CTOs at Fortune 500 companies
- 15+ Engineering Directors at major tech firms
- 25+ Senior Product Managers across various industries
- Multiple successful startup founders with Series A+ funding

**Industry Recognition**
Several of our graduates received prestigious awards:
- Kwame Osei (Class of 2015) named "30 Under 30" in Technology by Forbes Africa
- Ama Mensah (Class of 2018) received "Rising Star in AI" award from Tech Leaders Africa
- Kofi Asante (Class of 2012) recognized as one of Ghana's Top 50 CEOs

**Startup Success Stories**

**PayTech Ghana - Series B Funding**
Founded by Yaw Boakye (Class of 2014), PayTech Ghana recently closed a $15M Series B funding round. The fintech company now serves over 500,000 users across West Africa.

**EduLearn Africa - Expanding Across the Continent**
Akosua Mensah (Class of 2016) is leading EduLearn Africa's expansion into 5 new African countries. The EdTech platform has impacted over 100,000 students.

**What This Means**

These achievements reflect:
- Quality of ATU's engineering and technology programs
- Strong emphasis on practical skills and innovation
- Supportive alumni network enabling career growth
- University's commitment to producing industry-ready graduates

**Supporting Future Success**

ATU continues to invest in:
- Updated curriculum aligned with industry needs
- Partnerships with leading tech companies
- Internship and co-op programs
- Career development and mentorship initiatives

We're incredibly proud of our alumni's accomplishments and look forward to celebrating more success stories!`,
                featured_image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
                category: "Career",
                tags: ["technology", "career success", "alumni achievements", "leadership"],
                is_featured: true
            },
            {
                title: "Annual Homecoming 2025: Record Attendance Expected",
                slug: "annual-homecoming-2025-record-attendance",
                excerpt: "Save the date! The ATU Annual Homecoming scheduled for December 5-7, 2025, is shaping up to be the largest reunion in university history with over 1,000 alumni expected to attend.",
                content: `Mark your calendars! The ATU Annual Homecoming 2025 promises to be our biggest and best reunion yet.

**Event Highlights:**

**Friday, December 5**
- Welcome Reception at the Alumni Center
- Campus Walking Tours showcasing new facilities
- Class Reunion Dinners (by graduation year)

**Saturday, December 6**
- Homecoming Parade featuring alumni floats
- Football Game: ATU Warriors vs. State University
- Alumni Awards Ceremony
- Live Music Festival
- Food Fair featuring local vendors

**Sunday, December 7**
- Thanksgiving Service
- Farewell Brunch
- Career Networking Session

**New This Year:**

**Virtual Attendance Option**
Can't make it in person? Join us virtually! We're livestreaming key events including the awards ceremony and selected panel discussions.

**Family-Friendly Activities**
- Kids' zone with games and entertainment
- Face painting and balloon artists
- Alumni family photo booth

**Professional Development Track**
Special sessions on:
- Career transitions and growth
- Entrepreneurship workshops
- Industry-specific networking

**Registration Information**

**Early Bird Pricing (Until Nov 15):**
- Alumni: GHS 150
- Alumni + Guest: GHS 250
- Family Package (2 adults + 2 children): GHS 400

**Regular Pricing (After Nov 15):**
- Alumni: GHS 200
- Alumni + Guest: GHS 350
- Family Package: GHS 500

**What's Included:**
- Access to all homecoming events
- Homecoming t-shirt and memorabilia
- Meals and refreshments
- Commemorative program book

**Accommodation**

Special rates negotiated with local hotels:
- Golden Tulip Accra: GHS 300/night
- Movenpick Ambassador Hotel: GHS 450/night
- Holiday Inn Airport: GHS 280/night

**How to Register**

1. Visit alumni.atu.edu.gh/homecoming2025
2. Complete registration form
3. Make payment via mobile money or bank transfer
4. Receive confirmation email with event details

**Why Attend?**

"Homecoming is more than just an event—it's a celebration of our shared experiences and lasting friendships. It's a chance to reconnect, reminisce, and create new memories." - Dr. Emmanuel Asante, Director of Alumni Relations

Don't miss this incredible opportunity to reconnect with classmates, explore campus improvements, and celebrate our ATU pride!

Questions? Contact: homecoming@atu.edu.gh or call +233 24 123 4567`,
                featured_image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800",
                category: "Social",
                tags: ["homecoming", "reunion", "campus events", "networking"],
                is_featured: true
            },
            {
                title: "New Scholarship Fund Established for Underprivileged Students",
                slug: "new-scholarship-fund-underprivileged-students",
                excerpt: "Thanks to generous contributions from alumni, ATU has established a GHS 500,000 scholarship fund to support academically talented students from underprivileged backgrounds.",
                content: `ATU is proud to announce the establishment of the Alumni Opportunity Scholarship Fund, a transformative initiative made possible by the generosity of our alumni community.

**Fund Overview:**

**Total Fund Size:** GHS 500,000
**Annual Scholarships:** 20 full scholarships
**Coverage:** Full tuition, accommodation, and living stipend
**Duration:** 4-year renewable scholarships

**Eligibility Criteria:**

Students must demonstrate:
- Strong academic performance (minimum 3.5 GPA)
- Financial need
- Leadership potential
- Community involvement

**Impact Story: Meet Sarah Mensah**

Sarah, our first scholarship recipient, shares her story:

"Growing up in a small village in the Northern Region, university seemed like an impossible dream. My parents are subsistence farmers who could barely afford my secondary school fees. When I received the Alumni Opportunity Scholarship, it changed everything.

Now I'm pursuing my dream of becoming a civil engineer. I'm not just getting an education—I'm getting mentorship, career guidance, and a support network through the alumni community. This scholarship isn't just changing my life; it's transforming my entire family's future."

**How the Fund Works:**

The scholarship operates on a sustainable model:
- Initial capital: Alumni donations
- Investment returns: Managed by professional fund managers
- Annual disbursements: From investment returns
- Growing fund: Continued alumni contributions

**Selection Process:**

1. **Application:** Students submit applications with essays and recommendations
2. **Review:** Committee of alumni and faculty evaluate applications
3. **Interviews:** Shortlisted candidates interviewed
4. **Selection:** Final recipients announced
5. **Mentorship:** Each scholar paired with an alumni mentor

**Beyond Financial Support:**

Scholarship recipients receive:
- Full tuition and fees coverage
- Housing and meal plans
- Book allowance
- Laptop and study materials
- Monthly living stipend (GHS 500)
- Summer internship opportunities
- Alumni mentorship
- Career counseling

**Major Contributors:**

We extend our deepest gratitude to:
- Class of 2010 (GHS 150,000 collective donation)
- Kwame Osei Foundation (GHS 100,000)
- MTN Ghana (Corporate partner - GHS 80,000)
- Individual alumni donors (GHS 170,000)

**How You Can Help:**

**Make a One-Time Donation:**
- GHS 1,000: Support student for one semester
- GHS 4,000: Fund one year of education
- GHS 16,000: Full 4-year scholarship
- Any amount: Every contribution makes a difference

**Monthly Giving:**
Join our "Change Makers Club"
- Bronze: GHS 50/month
- Silver: GHS 100/month
- Gold: GHS 250/month
- Platinum: GHS 500/month

**Corporate Matching:**
Check if your employer matches charitable donations to double your impact.

**Long-Term Vision:**

Our goal is to grow the fund to:
- GHS 2 million by 2027
- Support 50 students annually by 2028
- Expand to graduate scholarships by 2029

**Donate Now:**

Visit: giving.atu.edu.gh/scholarships
Mobile Money: 024-DONATE-ATU
Bank Transfer: ATU Foundation Account
Contact: giving@atu.edu.gh

**Tax Benefits:**

All donations are tax-deductible. You'll receive a receipt for your records.

Together, we're not just funding education—we're investing in Ghana's future leaders, innovators, and change-makers.

Thank you for making a difference!`,
                featured_image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800",
                category: "University",
                tags: ["scholarship", "giving", "education", "social impact"],
                is_featured: false
            },
            {
                title: "ATU Engineering Department Receives International Accreditation",
                slug: "atu-engineering-international-accreditation",
                excerpt: "The Engineering Department at ATU has achieved international accreditation from the Accreditation Board for Engineering and Technology (ABET), joining elite institutions worldwide.",
                content: `ATU's Engineering Department has achieved a significant milestone by receiving full accreditation from the Accreditation Board for Engineering and Technology (ABET).

**What This Means:**

**For Current Students:**
- Degree recognized internationally
- Enhanced mobility for study abroad
- Better job prospects globally
- Eligibility for international professional certifications

**For Alumni:**
- Your degree gains international recognition
- Professional Engineer (PE) license eligibility
- Enhanced career opportunities abroad
- Increased degree value and prestige

**Accreditation Process:**

The rigorous ABET evaluation included:
- Comprehensive program review
- Faculty qualifications assessment
- Laboratory and facility inspection
- Student outcome evaluation
- Curriculum standards verification

**What ABET Evaluated:**

1. **Student Outcomes:** Assessment of technical and professional skills
2. **Curriculum:** Alignment with international standards
3. **Faculty:** Qualifications and professional development
4. **Facilities:** Laboratories, equipment, and learning spaces
5. **Institutional Support:** Resources and commitment to quality

**Programs Accredited:**

- B.Sc. Civil Engineering
- B.Sc. Electrical Engineering
- B.Sc. Mechanical Engineering
- B.Sc. Computer Engineering
- B.Sc. Chemical Engineering

**Key Improvements Made:**

To achieve accreditation, the department:
- Upgraded laboratory equipment (GHS 5M investment)
- Hired additional faculty with Ph.D. qualifications
- Implemented continuous improvement processes
- Strengthened industry partnerships
- Enhanced curriculum with more practical components

**Global Recognition:**

ATU now joins prestigious institutions including:
- MIT, Stanford, and UC Berkeley (USA)
- Imperial College London (UK)
- University of Toronto (Canada)
- National University of Singapore

**Industry Response:**

Major employers have expressed excitement:

"ABET accreditation confirms what we already knew—ATU produces world-class engineers. We're expanding our recruitment on campus." - Engineering Director, Tullow Oil Ghana

**What's Next:**

The department plans to:
- Seek accreditation for additional programs
- Establish international exchange programs
- Attract more international students
- Strengthen research capabilities

**Alumni Impact:**

For alumni who graduated before accreditation:
- Your degree's value is enhanced retroactively
- Recognition of your education quality increases
- Professional opportunities expand
- Pride in your alma mater grows

**Celebrating Excellence:**

This achievement reflects years of dedication by:
- Faculty and staff
- University leadership
- Students and alumni
- Industry partners
- Accreditation preparation team

We're incredibly proud of this accomplishment and grateful to everyone who contributed to this success!

For more information: engineering@atu.edu.gh`,
                featured_image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800",
                category: "Academic",
                tags: ["accreditation", "engineering", "international recognition", "academic excellence"],
                is_featured: false
            },
            {
                title: "Alumni Spotlight: From Graduate to Global Leader",
                slug: "alumni-spotlight-graduate-to-global-leader",
                excerpt: "Meet Abena Osei, Class of 2012, who went from ATU graduate to Vice President of Engineering at one of Silicon Valley's fastest-growing startups.",
                content: `This month's alumni spotlight features Abena Osei, whose journey from ATU student to Silicon Valley leader inspires us all.

**The Journey:**

**2008-2012: ATU Years**
Abena studied Computer Science at ATU, graduating with first-class honors. "ATU taught me not just technical skills, but how to think critically and solve complex problems," she recalls.

During her time at ATU, Abena:
- Led the Computer Science Students Association
- Won multiple coding competitions
- Completed internships at local tech companies
- Started a coding club for high school students

**2012-2015: Early Career in Ghana**
After graduation, Abena joined Vodafone Ghana as a software engineer. Within two years, she was leading a team of 8 engineers working on mobile payment solutions.

**2015-2018: International Transition**
Abena earned a Master's degree in Computer Science from Stanford University through a prestigious scholarship. "The foundation I got from ATU made me competitive with students from anywhere in the world," she notes.

**2018-2020: Rapid Rise**
Joined TechFlow (a Silicon Valley startup) as a Senior Engineer. Promoted to Engineering Manager after 10 months, then to Director of Engineering after 18 months.

**2020-Present: Executive Leadership**
Currently serves as VP of Engineering at TechFlow, overseeing 200+ engineers across 15 teams. The company recently achieved unicorn status (valued at over $1 billion).

**Key Achievements:**

**Technical Leadership**
- Led architecture redesign serving 10M+ users
- Implemented ML systems improving user experience by 300%
- Built engineering culture focused on innovation and inclusion

**Diversity Advocacy**
- Founded "Tech Sisters Africa" mentoring 500+ women in tech
- Speaks at conferences on diversity in technology
- Recruits African engineers for Silicon Valley companies

**Giving Back to ATU**
- Established internship program placing ATU students at TechFlow
- Guest lectures at ATU annually
- Mentors 20+ ATU students and alumni
- Donated GHS 50,000 to Computer Science Department

**Her Advice to Current Students:**

**1. Master the Fundamentals**
"Don't just learn to code—understand computer science principles deeply. These fundamentals will serve you throughout your career."

**2. Build Things**
"Create projects beyond your coursework. Your GitHub portfolio matters as much as your grades."

**3. Network Actively**
"Connect with alumni, attend tech meetups, participate in hackathons. Your network is your net worth."

**4. Stay Curious**
"Technology evolves rapidly. Commit to continuous learning. The moment you stop learning, you start becoming irrelevant."

**5. Give Back**
"As you climb, reach back and help others up. The ATU community supported me—now it's my turn to support others."

**Personal Philosophy:**

"Success isn't just about personal achievement—it's about creating opportunities for others. My goal is to help 1,000 African engineers land roles at top global tech companies by 2030."

**Looking Ahead:**

Abena is currently working on:
- Launching a coding bootcamp in Accra
- Writing a book on breaking into tech
- Expanding Tech Sisters Africa across the continent
- Advising African tech startups

**Words of Gratitude:**

"Everything I've accomplished traces back to the education and values I received at ATU. The university didn't just give me technical skills—it gave me confidence, resilience, and a problem-solving mindset that has served me well globally.

To current ATU students: Your degree can take you anywhere in the world. Dream big, work hard, and remember where you came from."

**Connect with Abena:**
- LinkedIn: linkedin.com/in/abenaosei
- Twitter: @AbenaInTech
- Tech Sisters Africa: techsistersafrica.org

We're incredibly proud of Abena and grateful for her continued engagement with the ATU community!

*Want to be featured in Alumni Spotlight? Contact: alumni@atu.edu.gh*`,
                featured_image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
                category: "Alumni",
                tags: ["alumni spotlight", "success story", "career inspiration", "technology"],
                is_featured: false
            },
            {
                title: "Research Collaboration: ATU Partners with MIT on AI Project",
                slug: "atu-mit-ai-research-collaboration",
                excerpt: "ATU's Computer Science Department has partnered with MIT's Computer Science and Artificial Intelligence Laboratory (CSAIL) on groundbreaking AI research focused on African languages.",
                content: `ATU is proud to announce a landmark research partnership with the Massachusetts Institute of Technology (MIT) focused on advancing artificial intelligence for African languages.

**Project Overview:**

**Title:** "Inclusive AI: Natural Language Processing for African Languages"

**Duration:** 3 years (2025-2028)

**Funding:** $2.5 million (supported by Google AI, Microsoft Research)

**Objective:** Develop AI models that understand and process African languages with the same accuracy as English and other well-resourced languages.

**Why This Matters:**

**Current Gap:**
Most AI language models perform poorly on African languages because:
- Limited training data available
- Few researchers working on these languages
- Lack of linguistic resources and tools
- Insufficient funding for research

**Real-World Impact:**
Better AI for African languages enables:
- Improved translation services
- Voice assistants in local languages
- Better educational technology
- Enhanced accessibility for millions

**Research Focus Areas:**

**1. Data Collection**
Creating comprehensive datasets for:
- Twi (Ghana)
- Ga (Ghana)
- Swahili (East Africa)
- Yoruba (Nigeria)
- Zulu (South Africa)
- Additional 15+ languages

**2. Model Development**
Building AI models that:
- Understand context and nuance
- Handle code-switching (mixing languages)
- Respect cultural context
- Work offline for areas with limited internet

**3. Applications**
Developing practical tools:
- Educational apps for children
- Translation services
- Voice assistants
- Text-to-speech systems
- Healthcare communication tools

**Team Composition:**

**ATU Team (15 researchers):**
- 5 Faculty members (Computer Science & Linguistics)
- 8 Ph.D. students
- 2 Post-doctoral researchers

**MIT Team (10 researchers):**
- 3 Senior researchers from CSAIL
- 5 Graduate students
- 2 Language technology experts

**Visiting Researchers:**
- Linguists from University of Ghana
- Language experts from various African institutions

**Student Opportunities:**

**For ATU Students:**
- Research assistantships (20 positions)
- Summer internships at MIT (5 positions annually)
- Co-authorship on research papers
- Conference travel funding
- Skill development in AI/NLP

**Application Process:**
Open to:
- Computer Science students (sophomore level+)
- Linguistics students
- Mathematics students with programming skills

**Project Milestones:**

**Year 1 (2025):**
- Build initial datasets for 5 languages
- Establish research protocols
- Train baseline models
- First joint publication

**Year 2 (2026):**
- Expand to 10 more languages
- Develop specialized models
- Launch beta applications
- Student exchange program begins

**Year 3 (2027-2028):**
- Complete models for 20+ languages
- Release open-source tools
- Deploy real-world applications
- Major conference presentations

**Broader Implications:**

**For ATU:**
- Enhanced research reputation
- Attracts top students and faculty
- Increases international collaborations
- Strengthens AI/ML programs

**For Ghana:**
- Positions Ghana as AI research hub in Africa
- Creates high-skilled jobs
- Preserves and promotes local languages
- Advances technological sovereignty

**Industry Partnerships:**

Supporting organizations:
- Google AI (Research funding and cloud credits)
- Microsoft Research (Azure resources)
- MTN Ghana (Local deployment support)
- Vodafone (Communications infrastructure)

**Open Source Commitment:**

All research outputs will be:
- Freely available to researchers
- Published in open-access journals
- Shared with African tech community
- Implemented in free applications

**Previous Successes:**

This builds on ATU's track record:
- 2018: Twi speech recognition project
- 2020: Ga language keyboard development
- 2022: African languages dataset publication
- 2023: Collaboration with Google on Twi translation

**How to Get Involved:**

**Students:**
Apply for research positions at: research.cs.atu.edu.gh

**Researchers:**
Collaboration inquiries: collaboration@atu.edu.gh

**Language Speakers:**
Contribute to datasets: languages@atu.edu.gh

**Donors:**
Support this work: giving.atu.edu.gh/research

**Quote from Leadership:**

Dr. Kwame Mensah, Project Lead (ATU):
"This partnership validates ATU's research capabilities and positions us at the forefront of AI research in Africa. We're not just consumers of technology—we're creators shaping the future of AI for our continent."

Prof. Regina Chen, CSAIL Director (MIT):
"ATU brings deep linguistic and cultural knowledge that's essential for this work. True AI inclusivity requires genuine partnership with African institutions."

**Stay Updated:**

Follow the project:
- Website: africanai.atu.edu.gh
- Twitter: @ATU_MIT_AI
- Newsletter: Subscribe at project website

This is just the beginning of ATU's journey in cutting-edge AI research. We're excited about the possibilities ahead!`,
                featured_image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
                category: "Academic",
                tags: ["research", "AI", "MIT", "collaboration", "innovation"],
                is_featured: true
            },
            {
                title: "Career Fair 2025: 50+ Companies Recruiting ATU Talent",
                slug: "career-fair-2025-companies-recruiting",
                excerpt: "The annual ATU Career Fair returns November 20-21, 2025, featuring over 50 leading companies actively recruiting for internships, graduate programs, and full-time positions.",
                content: `Mark your calendars for the biggest career opportunity of the year! The ATU Career Fair 2025 brings together top employers and talented students/alumni.

**Event Details:**

**Dates:** November 20-21, 2025
**Location:** ATU Sports Complex
**Time:** 9:00 AM - 5:00 PM (both days)
**Registration:** Free (register online)

**Participating Companies:**

**Technology:**
- Google Ghana
- Microsoft West Africa
- MTN Ghana
- Vodafone Ghana
- IBM
- Andela
- Flutterwave
- Paystack
- Jumia

**Financial Services:**
- Standard Chartered
- Barclays Ghana
- Fidelity Bank
- CalBank
- PwC Ghana
- Deloitte Ghana
- KPMG

**Engineering & Construction:**
- Tullow Oil
- Dangote Group
- China State Construction
- Julius Berger
- Kosmos Energy

**FMCG & Retail:**
- Unilever Ghana
- Guinness Ghana
- Nestlé Ghana
- Shoprite
- Game Stores

**Plus 30+ more companies!**

**What's Available:**

**1. Internships**
- Summer internships 2026
- Industrial attachments
- Co-op programs
- Research internships

**2. Graduate Programs**
- Management trainee positions
- Graduate engineer programs
- Technical associate roles
- Leadership development programs

**3. Full-Time Positions**
- Entry-level roles
- Experienced positions
- Specialized technical roles
- Management positions

**4. Entrepreneurship Support**
- Startup incubator programs
- Venture capital connections
- Business mentorship
- Innovation challenges

**Event Format:**

**Company Booths**
- One-on-one conversations with recruiters
- Company presentations
- Application submissions
- On-site interviews (selected companies)

**Career Workshops** (Free with registration)

**Day 1 (November 20):**
- 10:00 AM: "Resume Writing That Gets Noticed"
- 12:00 PM: "Acing the Technical Interview"
- 2:00 PM: "Salary Negotiation Strategies"
- 4:00 PM: "LinkedIn Profile Optimization"

**Day 2 (November 21):**
- 10:00 AM: "Transitioning from Student to Professional"
- 12:00 PM: "Building Your Personal Brand"
- 2:00 PM: "Networking Like a Pro"
- 4:00 PM: "Career Pivots and Transitions"

**Panel Discussions:**

**"Breaking Into Tech Without a CS Degree"**
- Thursday, 3:00 PM
- Panelists from Google, Microsoft, Andela

**"Finance Careers: Beyond Banking"**
- Friday, 11:00 AM
- Panelists from PwC, Standard Chartered, Venture Capital

**Alumni Mentors:**

50+ successful alumni volunteering as career mentors:
- 15-minute one-on-one sessions
- Career advice and guidance
- Industry insights
- Networking opportunities

**Book your slot:** Register online and select mentor session

**How to Prepare:**

**Before the Fair:**
1. **Research Companies**
   - Know who's attending
   - Understand their culture and values
   - Identify roles you're interested in

2. **Prepare Documents**
   - Print 20+ copies of your resume
   - Bring transcripts
   - Portfolio/projects (if applicable)
   - Business cards (if you have them)

3. **Craft Your Pitch**
   - 30-second introduction
   - Why you're interested in the company
   - What makes you unique
   - What you're looking for

4. **Dress Professionally**
   - Business formal or business casual
   - First impressions matter
   - Comfortable shoes (you'll be walking!)

**During the Fair:**
- Arrive early (9:00 AM recommended)
- Visit priority companies first
- Take notes after each conversation
- Collect business cards
- Be confident and enthusiastic
- Ask thoughtful questions

**After the Fair:**
- Send thank-you emails within 24 hours
- Follow up on promised actions
- Connect on LinkedIn
- Apply for positions online (if required)
- Track all applications

**Success Tips:**

**From Recruiters:**
"We're looking for candidates who:
- Are genuinely interested in our company
- Ask insightful questions
- Demonstrate relevant skills
- Show professionalism
- Follow up after the event"

**From Alumni:**
"The career fair landed me my dream job! Here's what worked:
- I researched every company beforehand
- Practiced my 30-second pitch
- Focused on quality conversations over quantity
- Followed up promptly
- Used connections made to network further"

**Virtual Option:**

Can't attend in person?
- Virtual career fair: November 22-23
- Online company presentations
- Video interview slots
- Digital resume submissions

**Register:** careers.atu.edu.gh/virtual

**Special Programs:**

**For Final Year Students:**
- "Fast Track" interviews with selected companies
- On-campus interview scheduling
- Priority consideration for graduate programs

**For Alumni:**
- Alumni-only networking session
- Career transition support
- Advanced positions track

**Prizes & Giveaways:**

- Lucky draws at each booth
- Best-dressed awards
- Resume makeover prizes
- Interview coaching vouchers
- Gift hampers from sponsors

**Registration:**

**Required for Entry:**
Register at: careers.atu.edu.gh/careerfair2025

**What You Get:**
- Event access badge
- Career fair guide booklet
- Company directory
- Workshop vouchers
- Meal vouchers (lunch provided)
- Career swag bag

**Important Deadlines:**

- **November 10:** Early bird registration ends (extra swag)
- **November 15:** Workshop pre-registration closes
- **November 18:** Mentor session booking deadline
- **November 19:** Walk-in registration (if space available)

**Contact:**

Questions? 
- Email: careerfair@atu.edu.gh
- Phone: +233 24 CAREER-ATU
- WhatsApp: +233 50 888 9999

**Social Media:**

Follow for updates:
- Instagram: @ATUCareerFair
- Twitter: @ATU_Careers
- LinkedIn: ATU Career Services
- Hashtag: #ATUCareerFair2025

Don't miss this incredible opportunity to jumpstart your career!

See you there! 🎓💼`,
                featured_image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
                category: "Career",
                tags: ["career fair", "recruitment", "jobs", "networking", "internships"],
                is_featured: false
            }
        ];

        const articleIds = [];

        console.log("📰 Creating news articles...\n");

        for (const article of articles) {
            const result = await pool.query(
                `INSERT INTO news_articles (
                    author_id, title, slug, excerpt, content, featured_image,
                    category, tags, is_featured, is_published
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, title`,
                [
                    adminId,
                    article.title,
                    article.slug,
                    article.excerpt,
                    article.content,
                    article.featured_image,
                    article.category,
                    article.tags,
                    article.is_featured,
                    true
                ]
            );

            articleIds.push(result.rows[0].id);
            console.log(`✅ Created article: ${result.rows[0].title}`);
        }

        console.log("\n✅ All articles created successfully!\n");

        // ==================== COMMENTS ====================

        if (alumniIds.length > 0) {
            console.log("💬 Creating news comments...\n");

            const comments = [
                {
                    article_index: 0,
                    user_id: alumniIds[0] || adminId,
                    comment: "This platform is exactly what we needed! Excited to reconnect with classmates and explore job opportunities. Great work ATU!"
                },
                {
                    article_index: 0,
                    user_id: alumniIds[1] || adminId,
                    comment: "Finally, a centralized place for alumni activities. The job board looks promising. Can't wait to see the mobile app!"
                },
                {
                    article_index: 1,
                    user_id: alumniIds[0] || adminId,
                    comment: "So proud to be an ATU alumnus! These achievements show the quality of education we received. Let's keep pushing boundaries!"
                },
                {
                    article_index: 2,
                    user_id: alumniIds[1] || adminId,
                    comment: "Already registered for homecoming! Bringing my entire family. This will be amazing! 🎉"
                },
                {
                    article_index: 2,
                    user_id: alumniIds[0] || adminId,
                    comment: "Will there be a special reunion for Class of 2015? Would love to organize something!"
                },
                {
                    article_index: 3,
                    user_id: alumniIds[1] || adminId,
                    comment: "This scholarship fund is transformational! Just donated GHS 5,000. Let's all contribute to help talented students achieve their dreams."
                },
                {
                    article_index: 4,
                    user_id: alumniIds[0] || adminId,
                    comment: "ABET accreditation is huge! This puts ATU engineering programs on par with top universities globally. Proud moment! 🎓"
                },
                {
                    article_index: 5,
                    user_id: alumniIds[1] || adminId,
                    comment: "Abena's story is incredibly inspiring! She's proof that ATU graduates can compete anywhere in the world. Thank you for paving the way!"
                },
                {
                    article_index: 6,
                    user_id: alumniIds[0] || adminId,
                    comment: "This MIT collaboration is groundbreaking! African languages deserve proper AI support. Excited to see ATU leading this effort."
                },
                {
                    article_index: 7,
                    user_id: alumniIds[1] || adminId,
                    comment: "Career fair is always excellent! Last year I got 3 interview offers. Current students - don't miss this opportunity!"
                }
            ];

            for (const comment of comments) {
                const articleId = articleIds[comment.article_index];

                await pool.query(
                    `INSERT INTO news_comments (news_id, user_id, comment)
                     VALUES ($1, $2, $3)`,
                    [articleId, comment.user_id, comment.comment]
                );

                console.log(`✅ Created comment for article ID: ${articleId}`);
            }

            console.log("\n✅ All comments created successfully!\n");

            // ==================== LIKES ====================

            console.log("👍 Adding article likes...\n");

            // Add likes to articles
            for (let i = 0; i < Math.min(5, articleIds.length); i++) {
                const articleId = articleIds[i];
                const numLikes = Math.floor(Math.random() * 15) + 10; // 10-25 likes

                for (let j = 0; j < Math.min(numLikes, alumniIds.length); j++) {
                    try {
                        await pool.query(
                            `INSERT INTO news_likes (news_id, user_id)
                             VALUES ($1, $2)
                             ON CONFLICT DO NOTHING`,
                            [articleId, alumniIds[j % alumniIds.length]]
                        );
                    } catch (error) {
                        // Ignore duplicate errors
                    }
                }
            }

            console.log("✅ Article likes added!\n");
        }

        // ==================== VIEWS ====================

        console.log("👁️ Adding view counts...\n");

        for (const articleId of articleIds) {
            const viewCount = Math.floor(Math.random() * 500) + 100; // 100-600 views
            await pool.query(
                "UPDATE news_articles SET views_count = $1 WHERE id = $2",
                [viewCount, articleId]
            );
        }

        console.log("✅ View counts added!\n");

        // ==================== SUMMARY ====================

        console.log("============================================");
        console.log("✅ News data seeded successfully!");
        console.log("============================================\n");

        console.log("📊 Summary:");
        console.log(`   - Articles created: ${articles.length}`);
        console.log(`   - Comments created: ${alumniIds.length > 0 ? '10' : '0'}`);
        console.log(`   - Likes added: Multiple across articles`);
        console.log(`   - Views added: Random counts for engagement\n`);

        // Show final statistics
        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM news_articles WHERE is_published = true) as articles,
                (SELECT COUNT(*) FROM news_comments WHERE is_deleted = false) as comments,
                (SELECT SUM(views_count) FROM news_articles) as total_views,
                (SELECT SUM(likes_count) FROM news_articles) as total_likes,
                (SELECT COUNT(*) FROM news_articles WHERE is_featured = true) as featured_articles
        `);

        console.log("📈 News Statistics:");
        console.table(statsResult.rows[0]);

        console.log("\n📋 Articles by Category:");
        const categoryResult = await pool.query(`
            SELECT category, COUNT(*) as count
            FROM news_articles
            WHERE is_published = true
            GROUP BY category
            ORDER BY count DESC
        `);
        console.table(categoryResult.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedNewsData();