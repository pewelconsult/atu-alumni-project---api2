// src/migrations/014_seed_academic_structure.js
import pool from "../config/db.js";

const seedAcademicStructure = async () => {
    try {
        console.log("🌱 Starting academic structure data seeding...\n");

        // ==================== PROGRAM LEVELS ====================
        console.log("📚 Seeding program levels...\n");

        const programLevels = [
            { name: 'Advanced', code: 'ADV', description: 'Advanced Certificate Program', duration_years: 1.0, sort_order: 1 },
            { name: 'Diploma', code: 'DIP', description: 'Diploma Program', duration_years: 2.0, sort_order: 2 },
            { name: 'Higher National Diploma', code: 'HND', description: 'Higher National Diploma Program', duration_years: 3.0, sort_order: 3 },
            { name: 'Degree', code: 'DEG', description: 'Bachelor\'s Degree Program', duration_years: 4.0, sort_order: 4 },
            { name: 'Masters', code: 'MSC', description: 'Master\'s Degree Program', duration_years: 2.0, sort_order: 5 }
        ];

        for (const level of programLevels) {
            await pool.query(
                `INSERT INTO program_levels (name, code, description, duration_years, sort_order)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (code) DO NOTHING`,
                [level.name, level.code, level.description, level.duration_years, level.sort_order]
            );
            console.log(`✅ Created program level: ${level.name}`);
        }

        // ==================== FACULTIES ====================
        console.log("\n🏛️  Seeding faculties...\n");

        const faculties = [
            { 
                name: 'Faculty of Engineering', 
                code: 'FE',
                description: 'The Faculty of Engineering offers comprehensive engineering programs in various disciplines, focusing on practical skills and innovative solutions.'
            },
            { 
                name: 'Faculty of Applied Science and Mathematics', 
                code: 'FASM',
                description: 'Focuses on applied sciences, mathematics, and technology, preparing students for careers in science and technology sectors.'
            },
            { 
                name: 'Faculty of Business and Management Studies', 
                code: 'FBMS',
                description: 'Offers business administration, management, and entrepreneurship programs to develop future business leaders.'
            },
            { 
                name: 'Faculty of Applied Arts and Design', 
                code: 'FAAD',
                description: 'Specializes in creative arts, fashion design, textiles, and graphic design with emphasis on practical applications.'
            }
        ];

        const facultyIds = {};
        for (const faculty of faculties) {
            const result = await pool.query(
                `INSERT INTO faculties (name, code, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id`,
                [faculty.name, faculty.code, faculty.description]
            );
            facultyIds[faculty.code] = result.rows[0].id;
            console.log(`✅ Created faculty: ${faculty.name}`);
        }

        // ==================== DEPARTMENTS ====================
        console.log("\n🏢 Seeding departments...\n");

        const departments = [
            // Faculty of Engineering
            { faculty_code: 'FE', name: 'Mechanical Engineering', code: 'ME', description: 'Mechanical design, manufacturing, and thermal systems' },
            { faculty_code: 'FE', name: 'Civil Engineering', code: 'CE', description: 'Construction, structural engineering, and infrastructure development' },
            { faculty_code: 'FE', name: 'Electrical/Electronic Engineering', code: 'EEE', description: 'Electrical systems, electronics, and telecommunications' },
            { faculty_code: 'FE', name: 'Automobile Engineering', code: 'AE', description: 'Automotive systems, maintenance, and technology' },
            { faculty_code: 'FE', name: 'Building Technology', code: 'BT', description: 'Building construction, estimation, and project management' },
            { faculty_code: 'FE', name: 'Welding and Fabrication', code: 'WF', description: 'Welding technology, metal fabrication, and joining processes' },
            
            // Faculty of Applied Science and Mathematics
            { faculty_code: 'FASM', name: 'Computer Science', code: 'CS', description: 'Software development, data science, and information technology' },
            { faculty_code: 'FASM', name: 'Statistics', code: 'STAT', description: 'Statistical analysis, data analytics, and research methods' },
            { faculty_code: 'FASM', name: 'Applied Chemistry', code: 'CHEM', description: 'Industrial chemistry, chemical analysis, and quality control' },
            { faculty_code: 'FASM', name: 'Applied Physics', code: 'PHY', description: 'Applied physics, instrumentation, and measurement technology' },
            
            // Faculty of Business and Management Studies
            { faculty_code: 'FBMS', name: 'Business Administration', code: 'BA', description: 'Business management, entrepreneurship, and organizational behavior' },
            { faculty_code: 'FBMS', name: 'Accountancy', code: 'ACC', description: 'Financial accounting, auditing, and taxation' },
            { faculty_code: 'FBMS', name: 'Marketing', code: 'MKT', description: 'Marketing management, consumer behavior, and digital marketing' },
            { faculty_code: 'FBMS', name: 'Hospitality Management', code: 'HM', description: 'Hotel management, tourism, and catering services' },
            { faculty_code: 'FBMS', name: 'Secretaryship and Management Studies', code: 'SMS', description: 'Office management, secretarial practice, and business communication' },
            
            // Faculty of Applied Arts and Design
            { faculty_code: 'FAAD', name: 'Fashion Design and Textiles', code: 'FDT', description: 'Fashion design, textile technology, and garment production' },
            { faculty_code: 'FAAD', name: 'Graphic Design', code: 'GD', description: 'Visual communication, graphic design, and digital media' },
            { faculty_code: 'FAAD', name: 'Textile Design', code: 'TD', description: 'Textile design, pattern making, and fabric technology' }
        ];

        const departmentIds = {};
        for (const dept of departments) {
            const result = await pool.query(
                `INSERT INTO departments (faculty_id, name, code, description)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id`,
                [facultyIds[dept.faculty_code], dept.name, dept.code, dept.description]
            );
            departmentIds[dept.code] = result.rows[0].id;
            console.log(`✅ Created department: ${dept.name}`);
        }

        // ==================== PROGRAMS ====================
        console.log("\n🎓 Seeding programs...\n");

        // Get program level IDs
        const levelIds = {};
        const levelsResult = await pool.query('SELECT id, code FROM program_levels');
        levelsResult.rows.forEach(row => {
            levelIds[row.code] = row.id;
        });

        const programs = [
            // Mechanical Engineering Programs
            { dept_code: 'ME', level_code: 'HND', name: 'Mechanical Engineering', code: 'HND-ME', description: 'Higher National Diploma in Mechanical Engineering' },
            { dept_code: 'ME', level_code: 'DEG', name: 'Mechanical Engineering Technology', code: 'BTECH-ME', description: 'Bachelor of Technology in Mechanical Engineering' },
            
            // Civil Engineering Programs
            { dept_code: 'CE', level_code: 'HND', name: 'Civil Engineering', code: 'HND-CE', description: 'Higher National Diploma in Civil Engineering' },
            { dept_code: 'CE', level_code: 'DEG', name: 'Civil Engineering Technology', code: 'BTECH-CE', description: 'Bachelor of Technology in Civil Engineering' },
            
            // Electrical/Electronic Engineering Programs
            { dept_code: 'EEE', level_code: 'HND', name: 'Electrical/Electronic Engineering', code: 'HND-EEE', description: 'Higher National Diploma in Electrical/Electronic Engineering' },
            { dept_code: 'EEE', level_code: 'DEG', name: 'Electrical/Electronic Engineering Technology', code: 'BTECH-EEE', description: 'Bachelor of Technology in Electrical/Electronic Engineering' },
            
            // Automobile Engineering Programs
            { dept_code: 'AE', level_code: 'HND', name: 'Automobile Engineering', code: 'HND-AE', description: 'Higher National Diploma in Automobile Engineering' },
            { dept_code: 'AE', level_code: 'DEG', name: 'Automobile Engineering Technology', code: 'BTECH-AE', description: 'Bachelor of Technology in Automobile Engineering' },
            
            // Building Technology Programs
            { dept_code: 'BT', level_code: 'HND', name: 'Building Technology', code: 'HND-BT', description: 'Higher National Diploma in Building Technology' },
            { dept_code: 'BT', level_code: 'DEG', name: 'Building Technology', code: 'BTECH-BT', description: 'Bachelor of Technology in Building Technology' },
            
            // Welding and Fabrication Programs
            { dept_code: 'WF', level_code: 'DIP', name: 'Welding and Fabrication Technology', code: 'DIP-WF', description: 'Diploma in Welding and Fabrication Technology' },
            { dept_code: 'WF', level_code: 'HND', name: 'Welding and Fabrication Engineering', code: 'HND-WF', description: 'Higher National Diploma in Welding and Fabrication Engineering' },
            
            // Computer Science Programs
            { dept_code: 'CS', level_code: 'DIP', name: 'Computer Science', code: 'DIP-CS', description: 'Diploma in Computer Science' },
            { dept_code: 'CS', level_code: 'HND', name: 'Computer Science', code: 'HND-CS', description: 'Higher National Diploma in Computer Science' },
            { dept_code: 'CS', level_code: 'DEG', name: 'Computer Science', code: 'BSC-CS', description: 'Bachelor of Science in Computer Science' },
            { dept_code: 'CS', level_code: 'MSC', name: 'Information Technology', code: 'MSC-IT', description: 'Master of Science in Information Technology' },
            
            // Statistics Programs
            { dept_code: 'STAT', level_code: 'HND', name: 'Statistics', code: 'HND-STAT', description: 'Higher National Diploma in Statistics' },
            { dept_code: 'STAT', level_code: 'DEG', name: 'Statistics', code: 'BSC-STAT', description: 'Bachelor of Science in Statistics' },
            
            // Applied Chemistry Programs
            { dept_code: 'CHEM', level_code: 'HND', name: 'Applied Chemistry', code: 'HND-CHEM', description: 'Higher National Diploma in Applied Chemistry' },
            { dept_code: 'CHEM', level_code: 'DEG', name: 'Applied Chemistry', code: 'BSC-CHEM', description: 'Bachelor of Science in Applied Chemistry' },
            
            // Business Administration Programs
            { dept_code: 'BA', level_code: 'DIP', name: 'Business Administration', code: 'DIP-BA', description: 'Diploma in Business Administration' },
            { dept_code: 'BA', level_code: 'HND', name: 'Business Administration', code: 'HND-BA', description: 'Higher National Diploma in Business Administration' },
            { dept_code: 'BA', level_code: 'DEG', name: 'Business Administration', code: 'BSC-BA', description: 'Bachelor of Science in Business Administration' },
            { dept_code: 'BA', level_code: 'MSC', name: 'Business Administration', code: 'MBA', description: 'Master of Business Administration' },
            
            // Accountancy Programs
            { dept_code: 'ACC', level_code: 'HND', name: 'Accountancy', code: 'HND-ACC', description: 'Higher National Diploma in Accountancy' },
            { dept_code: 'ACC', level_code: 'DEG', name: 'Accountancy', code: 'BSC-ACC', description: 'Bachelor of Science in Accountancy' },
            
            // Marketing Programs
            { dept_code: 'MKT', level_code: 'HND', name: 'Marketing', code: 'HND-MKT', description: 'Higher National Diploma in Marketing' },
            { dept_code: 'MKT', level_code: 'DEG', name: 'Marketing', code: 'BSC-MKT', description: 'Bachelor of Science in Marketing' },
            
            // Hospitality Management Programs
            { dept_code: 'HM', level_code: 'DIP', name: 'Hospitality Management', code: 'DIP-HM', description: 'Diploma in Hospitality Management' },
            { dept_code: 'HM', level_code: 'HND', name: 'Hospitality Management', code: 'HND-HM', description: 'Higher National Diploma in Hospitality Management' },
            { dept_code: 'HM', level_code: 'DEG', name: 'Hospitality Management', code: 'BSC-HM', description: 'Bachelor of Science in Hospitality Management' },
            
            // Secretaryship Programs
            { dept_code: 'SMS', level_code: 'DIP', name: 'Secretaryship and Management Studies', code: 'DIP-SMS', description: 'Diploma in Secretaryship and Management Studies' },
            { dept_code: 'SMS', level_code: 'HND', name: 'Secretaryship and Management Studies', code: 'HND-SMS', description: 'Higher National Diploma in Secretaryship' },
            
            // Fashion Design Programs
            { dept_code: 'FDT', level_code: 'DIP', name: 'Fashion Design and Textiles', code: 'DIP-FDT', description: 'Diploma in Fashion Design and Textiles' },
            { dept_code: 'FDT', level_code: 'HND', name: 'Fashion Design and Textiles', code: 'HND-FDT', description: 'Higher National Diploma in Fashion Design and Textiles' },
            { dept_code: 'FDT', level_code: 'DEG', name: 'Fashion Design and Textiles', code: 'BSC-FDT', description: 'Bachelor of Science in Fashion Design and Textiles' },
            
            // Graphic Design Programs
            { dept_code: 'GD', level_code: 'DIP', name: 'Graphic Design', code: 'DIP-GD', description: 'Diploma in Graphic Design' },
            { dept_code: 'GD', level_code: 'HND', name: 'Graphic Design', code: 'HND-GD', description: 'Higher National Diploma in Graphic Design' },
            { dept_code: 'GD', level_code: 'DEG', name: 'Graphic Design', code: 'BSC-GD', description: 'Bachelor of Science in Graphic Design' }
        ];

        let programCount = 0;
        for (const program of programs) {
            try {
                await pool.query(
                    `INSERT INTO programs (department_id, program_level_id, name, code, description)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (code) DO NOTHING`,
                    [departmentIds[program.dept_code], levelIds[program.level_code], program.name, program.code, program.description]
                );
                programCount++;
                console.log(`✅ Created program: ${program.name} (${program.level_code})`);
            } catch (error) {
                console.error(`❌ Error creating program ${program.code}:`, error.message);
            }
        }

        // ==================== SUMMARY ====================
        console.log("\n============================================");
        console.log("✅ Academic structure data seeded successfully!");
        console.log("============================================\n");

        console.log("📊 Summary:");
        console.log(`   - Program Levels: ${programLevels.length}`);
        console.log(`   - Faculties: ${faculties.length}`);
        console.log(`   - Departments: ${departments.length}`);
        console.log(`   - Programs: ${programCount}\n`);

        // Show statistics
        const stats = await pool.query(`
            SELECT 
                f.name as faculty,
                COUNT(DISTINCT d.id) as departments,
                COUNT(DISTINCT p.id) as programs
            FROM faculties f
            LEFT JOIN departments d ON f.id = d.faculty_id
            LEFT JOIN programs p ON d.id = p.department_id
            GROUP BY f.id, f.name
            ORDER BY f.name
        `);

        console.log("📈 Programs by Faculty:");
        console.table(stats.rows);

        // Show programs view
        const programsView = await pool.query(`
            SELECT 
                faculty_name,
                department_name,
                level_name,
                program_name,
                program_code
            FROM v_programs_full
            ORDER BY faculty_name, department_name, level_sort_order
            LIMIT 20
        `);

        console.log("\n📚 Sample Programs (First 20):");
        console.table(programsView.rows);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedAcademicStructure();