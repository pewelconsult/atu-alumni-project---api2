// src/migrations/003_seed_test_data.js
import pool from "../config/db.js";
import bcrypt from "bcryptjs";

const seedTestData = async () => {
    try {
        console.log("🌱 Starting test data seeding...\n");

        // Check if we already have users
        const userCount = await pool.query("SELECT COUNT(*) FROM users");
        
        let adminId;
        
        if (parseInt(userCount.rows[0].count) === 0) {
            console.log("📝 Creating test admin user...");
            
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash("admin123", salt);
            
            const adminResult = await pool.query(
                `INSERT INTO users (
                    email, password_hash, role, first_name, last_name
                ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                ["admin@atu.edu.gh", password_hash, "admin", "Admin", "User"]
            );
            
            adminId = adminResult.rows[0].id;
            console.log(`✅ Admin user created (ID: ${adminId})`);
            console.log(`   Email: admin@atu.edu.gh`);
            console.log(`   Password: admin123\n`);
        } else {
            // Get first admin user
            const adminResult = await pool.query(
                "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
            );
            
            if (adminResult.rows.length > 0) {
                adminId = adminResult.rows[0].id;
                console.log(`✅ Using existing admin (ID: ${adminId})\n`);
            } else {
                console.log("❌ No admin user found. Please create one first.");
                process.exit(1);
            }
        }

        // Sample jobs data
        const jobs = [
            {
                company_name: "Google Ghana",
                company_logo: "https://logo.clearbit.com/google.com",
                company_website: "https://www.google.com",
                industry: "Technology",
                job_title: "Senior Software Engineer",
                job_description: "We are looking for an experienced software engineer to join our team in Accra. You will work on cutting-edge projects using the latest technologies.",
                job_type: "Full-time",
                location: "Accra",
                location_type: "Hybrid",
                salary_min: 120000,
                salary_max: 180000,
                salary_currency: "GHS",
                salary_period: "per year",
                experience_level: "Senior",
                education_required: "Bachelor's degree in Computer Science or related field",
                skills_required: ["JavaScript", "Python", "React", "Node.js", "PostgreSQL"],
                responsibilities: "Design and develop scalable web applications, mentor junior developers, participate in code reviews.",
                qualifications: "5+ years of experience in software development, strong problem-solving skills, excellent communication.",
                benefits: "Health insurance, flexible working hours, professional development budget, free meals.",
                application_deadline: "2025-12-31",
                application_email: "careers@google.com",
                positions_available: 3,
                is_featured: true
            },
            {
                company_name: "MTN Ghana",
                company_logo: "https://logo.clearbit.com/mtn.com",
                company_website: "https://www.mtn.com.gh",
                industry: "Telecommunications",
                job_title: "Network Engineer",
                job_description: "Join our network team to design, implement and maintain telecommunications infrastructure across Ghana.",
                job_type: "Full-time",
                location: "Accra",
                location_type: "On-site",
                salary_min: 80000,
                salary_max: 120000,
                salary_currency: "GHS",
                salary_period: "per year",
                experience_level: "Mid",
                education_required: "Bachelor's degree in Electrical Engineering or Computer Networks",
                skills_required: ["Networking", "Cisco", "Network Security", "TCP/IP"],
                responsibilities: "Configure and maintain network equipment, troubleshoot network issues, ensure network security.",
                qualifications: "3+ years experience in network administration, CCNA or equivalent certification preferred.",
                benefits: "Health insurance, annual bonus, training opportunities.",
                application_deadline: "2025-11-30",
                positions_available: 2,
                is_featured: false
            },
            {
                company_name: "Tech Startup Ghana",
                company_logo: null,
                company_website: "https://techstartup.gh",
                industry: "Technology",
                job_title: "Frontend Developer Intern",
                job_description: "Great opportunity for recent graduates to learn and grow in a fast-paced startup environment.",
                job_type: "Internship",
                location: "Remote",
                location_type: "Remote",
                salary_min: 2000,
                salary_max: 3000,
                salary_currency: "GHS",
                salary_period: "per month",
                experience_level: "Entry",
                education_required: "Currently pursuing or recently completed degree in Computer Science",
                skills_required: ["HTML", "CSS", "JavaScript", "React"],
                responsibilities: "Build responsive user interfaces, collaborate with design team, learn best practices.",
                qualifications: "Strong foundation in web development, eager to learn, good communication skills.",
                benefits: "Mentorship, flexible hours, potential for full-time employment.",
                application_deadline: "2025-11-15",
                application_url: "https://techstartup.gh/careers",
                positions_available: 5,
                is_featured: false
            },
            {
                company_name: "Ecobank Ghana",
                company_logo: "https://logo.clearbit.com/ecobank.com",
                company_website: "https://www.ecobank.com",
                industry: "Banking & Finance",
                job_title: "Business Analyst",
                job_description: "Analyze business processes and provide data-driven insights to improve banking operations.",
                job_type: "Full-time",
                location: "Kumasi",
                location_type: "On-site",
                salary_min: 90000,
                salary_max: 130000,
                salary_currency: "GHS",
                salary_period: "per year",
                experience_level: "Mid",
                education_required: "Bachelor's degree in Business Administration, Finance, or related field",
                skills_required: ["Data Analysis", "SQL", "Excel", "Business Intelligence"],
                responsibilities: "Gather business requirements, analyze data, create reports and dashboards.",
                qualifications: "2-4 years experience in business analysis, strong analytical skills.",
                benefits: "Health insurance, pension plan, annual leave, professional development.",
                application_deadline: "2025-12-15",
                application_email: "hr@ecobank.com",
                positions_available: 1,
                is_featured: true
            },
            {
                company_name: "Ghana Health Service",
                company_logo: null,
                company_website: "https://ghanahealthservice.org",
                industry: "Healthcare",
                job_title: "IT Support Specialist",
                job_description: "Provide technical support for hospital information systems and maintain IT infrastructure.",
                job_type: "Full-time",
                location: "Tamale",
                location_type: "On-site",
                salary_min: 50000,
                salary_max: 70000,
                salary_currency: "GHS",
                salary_period: "per year",
                experience_level: "Entry",
                education_required: "Diploma or Bachelor's in Information Technology",
                skills_required: ["Technical Support", "Windows", "Networking", "Hardware Maintenance"],
                responsibilities: "Troubleshoot IT issues, maintain computer systems, train staff on software.",
                qualifications: "1-2 years IT support experience, patient and good communicator.",
                benefits: "Government benefits, job security, health coverage.",
                application_deadline: "2025-11-20",
                positions_available: 2,
                is_featured: false
            }
        ];

        console.log("📝 Creating sample jobs...\n");

        for (const job of jobs) {
            const result = await pool.query(
                `INSERT INTO jobs (
                    posted_by, company_name, company_logo, company_website, industry,
                    job_title, job_description, job_type, location, location_type,
                    salary_min, salary_max, salary_currency, salary_period,
                    experience_level, education_required, skills_required,
                    responsibilities, qualifications, benefits,
                    application_deadline, application_url, application_email,
                    positions_available, is_featured
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
                RETURNING id, job_title, company_name`,
                [
                    adminId,
                    job.company_name,
                    job.company_logo,
                    job.company_website,
                    job.industry,
                    job.job_title,
                    job.job_description,
                    job.job_type,
                    job.location,
                    job.location_type,
                    job.salary_min,
                    job.salary_max,
                    job.salary_currency,
                    job.salary_period,
                    job.experience_level,
                    job.education_required,
                    job.skills_required,
                    job.responsibilities,
                    job.qualifications,
                    job.benefits,
                    job.application_deadline,
                    job.application_url || null,
                    job.application_email || null,
                    job.positions_available,
                    job.is_featured
                ]
            );

            console.log(`✅ Created: ${result.rows[0].job_title} at ${result.rows[0].company_name}`);
        }

        console.log("\n✅ Test data seeded successfully!");
        console.log(`\n📊 Summary:`);
        console.log(`   - Jobs created: ${jobs.length}`);
        console.log(`   - Admin ID: ${adminId}`);
        
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedTestData();