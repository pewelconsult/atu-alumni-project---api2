// src/migrations/012_seed_tracer_study_data.js
import pool from "../config/db.js";

const seedTracerStudyData = async () => {
    try {
        console.log("🌱 Starting tracer study data seeding...\n");

        // Get alumni users (FIXED - removed 'phone' column)
        const alumniResult = await pool.query(
            `SELECT id, first_name, last_name, email
             FROM users 
             WHERE role = 'alumni' AND is_active = true 
             LIMIT 20`
        );

        if (alumniResult.rows.length === 0) {
            console.log("❌ No alumni users found. Please create alumni users first.");
            process.exit(1);
        }

        const alumni = alumniResult.rows;
        console.log(`✅ Found ${alumni.length} alumni users\n`);

        // Define programmes
        const programmes = [
            'Mechanical Engineering',
            'Civil Engineering',
            'Electrical/Electronic Engineering',
            'Automobile Engineering',
            'Computer Science',
            'Fashion Design and Textiles',
            'Business Administration'
        ];

        // Define graduation years
        const graduationYears = [2020, 2021, 2022, 2023, 2024];

        // Sample responses data
        const responses = [
            {
                alumni_index: 0,
                programme: 'Computer Science',
                year: 2022,
                phone_number: '+233244123456',
                current_status: 'Employed',
                time_to_first_job: 'Less than 3 months',
                main_challenge: 'Finding a job',
                job_title: 'Software Engineer',
                employer_name: 'MTN Ghana',
                sector: 'Private',
                job_related_to_field: 'Yes',
                monthly_income_range: '5,000–9,999',
                how_found_job: 'Through personal contacts',
                job_level: 'Entry-level',
                skills_relevance_rating: 4,
                skills_to_strengthen: 'More emphasis on cloud computing (AWS, Azure) and DevOps practices. The theory was good but we needed more hands-on projects with real-world scenarios.',
                job_satisfaction_rating: 4,
                programme_quality_rating: 'Good',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 1,
                programme: 'Mechanical Engineering',
                year: 2021,
                phone_number: '+233244234567',
                current_status: 'Employed',
                time_to_first_job: '3–6 months',
                main_challenge: 'Lack of practical experience',
                job_title: 'Mechanical Design Engineer',
                employer_name: 'Volta River Authority',
                sector: 'Public',
                job_related_to_field: 'Yes',
                monthly_income_range: '5,000–9,999',
                how_found_job: 'Online job portal',
                job_level: 'Entry-level',
                skills_relevance_rating: 5,
                skills_to_strengthen: 'CAD software training should include more advanced features. Also, project management skills and industry-standard practices should be introduced earlier in the programme.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Excellent',
                internship_support_satisfaction: 'Very satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'WhatsApp',
                willing_to_collaborate: true
            },
            {
                alumni_index: 2,
                programme: 'Business Administration',
                year: 2023,
                phone_number: '+233244345678',
                current_status: 'Self-employed',
                time_to_first_job: 'Less than 3 months',
                main_challenge: 'Starting a business',
                job_title: 'Business Owner',
                employer_name: 'QuickLogistics Ghana',
                sector: 'Self-employed',
                job_related_to_field: 'Yes',
                monthly_income_range: '2,000–4,999',
                how_found_job: 'Started own business',
                job_level: 'Management / Executive',
                skills_relevance_rating: 4,
                skills_to_strengthen: 'Entrepreneurship should be a core course, not elective. Digital marketing, financial management for startups, and business plan development need more practical exercises.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Good',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: false,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: false
            },
            {
                alumni_index: 3,
                programme: 'Civil Engineering',
                year: 2020,
                phone_number: '+233244456789',
                current_status: 'Employed',
                time_to_first_job: '6–12 months',
                main_challenge: 'Finding a job',
                job_title: 'Site Engineer',
                employer_name: 'China State Construction Engineering Corporation',
                sector: 'Private',
                job_related_to_field: 'Yes',
                monthly_income_range: '5,000–9,999',
                how_found_job: 'Internship placement',
                job_level: 'Middle-level',
                skills_relevance_rating: 4,
                skills_to_strengthen: 'More focus on site management, construction project software (Primavera, MS Project), and health & safety regulations. Real site visits during training would be beneficial.',
                job_satisfaction_rating: 4,
                programme_quality_rating: 'Good',
                internship_support_satisfaction: 'Very satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'WhatsApp',
                willing_to_collaborate: true
            },
            {
                alumni_index: 4,
                programme: 'Electrical/Electronic Engineering',
                year: 2022,
                phone_number: '+233244567890',
                current_status: 'Employed',
                time_to_first_job: 'Less than 3 months',
                main_challenge: 'Finding a job',
                job_title: 'Electrical Engineer',
                employer_name: 'Electricity Company of Ghana',
                sector: 'Public',
                job_related_to_field: 'Yes',
                monthly_income_range: '5,000–9,999',
                how_found_job: 'ATU career office / lecturers',
                job_level: 'Entry-level',
                skills_relevance_rating: 5,
                skills_to_strengthen: 'Power systems analysis needs more practical components. Industrial automation and PLC programming should be mandatory. Otherwise, the programme was excellent.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Excellent',
                internship_support_satisfaction: 'Very satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 5,
                programme: 'Computer Science',
                year: 2024,
                phone_number: '+233244678901',
                current_status: 'Unemployed',
                time_to_first_job: 'Still seeking',
                main_challenge: 'Finding a job',
                job_title: null,
                employer_name: null,
                sector: null,
                job_related_to_field: null,
                monthly_income_range: null,
                how_found_job: null,
                job_level: null,
                skills_relevance_rating: 3,
                skills_to_strengthen: 'Need more training in modern frameworks (React, Angular, Node.js). The curriculum feels outdated compared to industry requirements. More collaboration with tech companies would help.',
                job_satisfaction_rating: null,
                programme_quality_rating: 'Fair',
                internship_support_satisfaction: 'Dissatisfied',
                would_recommend_atu: 'Maybe',
                is_alumni_member: false,
                willing_to_mentor: false,
                preferred_contact_method: 'Email',
                willing_to_collaborate: false
            },
            {
                alumni_index: 6,
                programme: 'Fashion Design and Textiles',
                year: 2023,
                phone_number: '+233244789012',
                current_status: 'Self-employed',
                time_to_first_job: '3–6 months',
                main_challenge: 'Starting a business',
                job_title: 'Fashion Designer',
                employer_name: 'AfriFashion Studios',
                sector: 'Self-employed',
                job_related_to_field: 'Yes',
                monthly_income_range: '2,000–4,999',
                how_found_job: 'Started own business',
                job_level: 'Management / Executive',
                skills_relevance_rating: 5,
                skills_to_strengthen: 'Business management for creatives, digital marketing, and e-commerce skills. Also need more exposure to international fashion trends and sustainability practices.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Excellent',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'WhatsApp',
                willing_to_collaborate: true
            },
            {
                alumni_index: 7,
                programme: 'Automobile Engineering',
                year: 2021,
                phone_number: '+233244890123',
                current_status: 'Employed',
                time_to_first_job: 'Less than 3 months',
                main_challenge: 'Lack of practical experience',
                job_title: 'Automotive Technician',
                employer_name: 'Toyota Ghana',
                sector: 'Private',
                job_related_to_field: 'Yes',
                monthly_income_range: '5,000–9,999',
                how_found_job: 'Internship placement',
                job_level: 'Entry-level',
                skills_relevance_rating: 5,
                skills_to_strengthen: 'More exposure to electric vehicle technology and hybrid systems. Diagnostic tools training was excellent but needs to include newer technologies.',
                job_satisfaction_rating: 4,
                programme_quality_rating: 'Excellent',
                internship_support_satisfaction: 'Very satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 8,
                programme: 'Business Administration',
                year: 2022,
                phone_number: '+233244901234',
                current_status: 'Employed',
                time_to_first_job: '3–6 months',
                main_challenge: 'Finding a job',
                job_title: 'Marketing Officer',
                employer_name: 'Unilever Ghana',
                sector: 'Private',
                job_related_to_field: 'Partly',
                monthly_income_range: '5,000–9,999',
                how_found_job: 'Online job portal',
                job_level: 'Entry-level',
                skills_relevance_rating: 4,
                skills_to_strengthen: 'Digital marketing needs its own dedicated course. Data analytics and consumer behavior analysis should be strengthened. More case studies from Ghanaian businesses.',
                job_satisfaction_rating: 4,
                programme_quality_rating: 'Good',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: false,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 9,
                programme: 'Computer Science',
                year: 2023,
                phone_number: '+233245012345',
                current_status: 'Pursuing further studies',
                time_to_first_job: null,
                main_challenge: 'Accessing further education',
                job_title: null,
                employer_name: null,
                sector: null,
                job_related_to_field: null,
                monthly_income_range: null,
                how_found_job: null,
                job_level: null,
                skills_relevance_rating: 4,
                skills_to_strengthen: 'Research methodology and academic writing. The foundation was good, which helped me get accepted for Masters. More advanced mathematics and algorithms coverage needed.',
                job_satisfaction_rating: null,
                programme_quality_rating: 'Good',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: false,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 10,
                programme: 'Civil Engineering',
                year: 2024,
                phone_number: '+233245123456',
                current_status: 'Employed',
                time_to_first_job: 'Less than 3 months',
                main_challenge: 'Finding a job',
                job_title: 'Junior Engineer',
                employer_name: 'Department of Urban Roads',
                sector: 'Public',
                job_related_to_field: 'Yes',
                monthly_income_range: '2,000–4,999',
                how_found_job: 'Through personal contacts',
                job_level: 'Entry-level',
                skills_relevance_rating: 4,
                skills_to_strengthen: 'More training on road design software, surveying equipment, and GIS applications. Lab equipment should be updated to match industry standards.',
                job_satisfaction_rating: 4,
                programme_quality_rating: 'Good',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: false,
                willing_to_mentor: false,
                preferred_contact_method: 'WhatsApp',
                willing_to_collaborate: false
            },
            {
                alumni_index: 11,
                programme: 'Mechanical Engineering',
                year: 2023,
                phone_number: '+233245234567',
                current_status: 'Self-employed',
                time_to_first_job: '6–12 months',
                main_challenge: 'Starting a business',
                job_title: 'Engineering Consultant',
                employer_name: 'TechMech Solutions',
                sector: 'Self-employed',
                job_related_to_field: 'Yes',
                monthly_income_range: '5,000–9,999',
                how_found_job: 'Started own business',
                job_level: 'Management / Executive',
                skills_relevance_rating: 5,
                skills_to_strengthen: 'Business development, proposal writing, and client management. The technical skills were excellent. Adding entrepreneurship training would be valuable.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Excellent',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 12,
                programme: 'Electrical/Electronic Engineering',
                year: 2020,
                phone_number: '+233245345678',
                current_status: 'Employed',
                time_to_first_job: '3–6 months',
                main_challenge: 'Finding a job',
                job_title: 'Senior Electrical Engineer',
                employer_name: 'Tullow Oil Ghana',
                sector: 'Private',
                job_related_to_field: 'Yes',
                monthly_income_range: '10,000 or above',
                how_found_job: 'Online job portal',
                job_level: 'Senior-level',
                skills_relevance_rating: 5,
                skills_to_strengthen: 'The programme was excellent overall. Perhaps more exposure to offshore engineering and oil & gas industry specifics would be beneficial for those interested in that sector.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Excellent',
                internship_support_satisfaction: 'Very satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 13,
                programme: 'Business Administration',
                year: 2021,
                phone_number: '+233245456789',
                current_status: 'Employed',
                time_to_first_job: 'Less than 3 months',
                main_challenge: 'Finding a job',
                job_title: 'Human Resource Manager',
                employer_name: 'Standard Chartered Bank Ghana',
                sector: 'Private',
                job_related_to_field: 'Yes',
                monthly_income_range: '10,000 or above',
                how_found_job: 'Internship placement',
                job_level: 'Middle-level',
                skills_relevance_rating: 5,
                skills_to_strengthen: 'HR analytics and HRIS systems training. Labour law could be covered in more depth. Otherwise, excellent preparation for the workplace.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Excellent',
                internship_support_satisfaction: 'Very satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            },
            {
                alumni_index: 14,
                programme: 'Computer Science',
                year: 2021,
                phone_number: '+233245567890',
                current_status: 'Employed',
                time_to_first_job: 'Less than 3 months',
                main_challenge: 'Finding a job',
                job_title: 'Senior Software Developer',
                employer_name: 'Andela Ghana',
                sector: 'Private',
                job_related_to_field: 'Yes',
                monthly_income_range: '10,000 or above',
                how_found_job: 'Online job portal',
                job_level: 'Senior-level',
                skills_relevance_rating: 4,
                skills_to_strengthen: 'Microservices architecture, containerization (Docker, Kubernetes), and CI/CD pipelines. Also, soft skills like agile methodologies and team collaboration.',
                job_satisfaction_rating: 5,
                programme_quality_rating: 'Good',
                internship_support_satisfaction: 'Satisfied',
                would_recommend_atu: 'Yes',
                is_alumni_member: true,
                willing_to_mentor: true,
                preferred_contact_method: 'Email',
                willing_to_collaborate: true
            }
        ];

        console.log("📝 Creating tracer study responses...\n");

        let successCount = 0;
        let skipCount = 0;

        for (const response of responses) {
            if (response.alumni_index >= alumni.length) {
                skipCount++;
                continue;
            }

            const alumnus = alumni[response.alumni_index];

            try {
                await pool.query(
                    `INSERT INTO tracer_study_responses (
                        user_id, full_name, index_number, programme_of_study, year_of_graduation,
                        email, phone_number, current_status, time_to_first_job, main_challenge,
                        job_title, employer_name, sector, job_related_to_field, monthly_income_range,
                        how_found_job, job_level, skills_relevance_rating, skills_to_strengthen,
                        job_satisfaction_rating, programme_quality_rating, internship_support_satisfaction,
                        would_recommend_atu, is_alumni_member, willing_to_mentor, preferred_contact_method,
                        willing_to_collaborate
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                        $21, $22, $23, $24, $25, $26, $27
                    )`,
                    [
                        alumnus.id,
                        `${alumnus.first_name} ${alumnus.last_name}`,
                        `ATU${response.year}${String(response.alumni_index + 1).padStart(4, '0')}`,
                        response.programme,
                        response.year,
                        alumnus.email,
                        response.phone_number, // Using phone_number from response data
                        response.current_status,
                        response.time_to_first_job,
                        response.main_challenge,
                        response.job_title,
                        response.employer_name,
                        response.sector,
                        response.job_related_to_field,
                        response.monthly_income_range,
                        response.how_found_job,
                        response.job_level,
                        response.skills_relevance_rating,
                        response.skills_to_strengthen,
                        response.job_satisfaction_rating,
                        response.programme_quality_rating,
                        response.internship_support_satisfaction,
                        response.would_recommend_atu,
                        response.is_alumni_member,
                        response.willing_to_mentor,
                        response.preferred_contact_method,
                        response.willing_to_collaborate
                    ]
                );

                successCount++;
                console.log(`✅ Created response for ${alumnus.first_name} ${alumnus.last_name} (${response.programme}, ${response.year})`);
            } catch (error) {
                if (error.code === '23505') { // Unique constraint violation
                    console.log(`⏭️  Skipped: User ${alumnus.first_name} already has a response`);
                    skipCount++;
                } else {
                    console.error(`❌ Error creating response for user ${alumnus.id}:`, error.message);
                }
            }
        }

        console.log("\n✅ All responses processed!\n");

        // ==================== SUMMARY ====================

        console.log("============================================");
        console.log("✅ Tracer study data seeded successfully!");
        console.log("============================================\n");

        console.log("📊 Summary:");
        console.log(`   - Responses created: ${successCount}`);
        console.log(`   - Responses skipped: ${skipCount}`);
        console.log(`   - Total processed: ${responses.length}\n`);

        // Show final statistics
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_responses,
                COUNT(CASE WHEN current_status = 'Employed' THEN 1 END) as employed,
                COUNT(CASE WHEN current_status = 'Self-employed' THEN 1 END) as self_employed,
                COUNT(CASE WHEN current_status = 'Unemployed' THEN 1 END) as unemployed,
                COUNT(CASE WHEN current_status = 'Pursuing further studies' THEN 1 END) as further_studies,
                COUNT(CASE WHEN willing_to_mentor = true THEN 1 END) as willing_mentors,
                ROUND(AVG(skills_relevance_rating), 2) as avg_skills_rating,
                ROUND(AVG(job_satisfaction_rating), 2) as avg_satisfaction
            FROM tracer_study_responses
            WHERE is_completed = true
        `);

        console.log("📈 Tracer Study Statistics:");
        console.table(statsResult.rows[0]);

        // Show responses by programme
        const programmeResult = await pool.query(`
            SELECT 
                programme_of_study,
                COUNT(*) as responses,
                COUNT(CASE WHEN current_status IN ('Employed', 'Self-employed') THEN 1 END) as employed_count
            FROM tracer_study_responses
            WHERE is_completed = true
            GROUP BY programme_of_study
            ORDER BY responses DESC
        `);

        console.log("\n📚 Responses by Programme:");
        console.table(programmeResult.rows);

        // Show responses by year
        const yearResult = await pool.query(`
            SELECT 
                year_of_graduation,
                COUNT(*) as responses
            FROM tracer_study_responses
            WHERE is_completed = true
            GROUP BY year_of_graduation
            ORDER BY year_of_graduation DESC
        `);

        console.log("\n📅 Responses by Graduation Year:");
        console.table(yearResult.rows);

        // Show sector distribution
        const sectorResult = await pool.query(`
            SELECT 
                sector,
                COUNT(*) as count
            FROM tracer_study_responses
            WHERE sector IS NOT NULL AND is_completed = true
            GROUP BY sector
            ORDER BY count DESC
        `);

        console.log("\n🏢 Employment by Sector:");
        console.table(sectorResult.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedTracerStudyData();