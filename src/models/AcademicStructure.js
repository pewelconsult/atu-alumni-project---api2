// src/models/AcademicStructure.js
import pool from "../config/db.js";

const AcademicStructureModel = {
    // Create all academic structure tables
    createTables: async () => {
        const query = `
            -- ==================== FACULTIES ====================
            CREATE TABLE IF NOT EXISTS faculties (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                code VARCHAR(20) NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties(code);
            CREATE INDEX IF NOT EXISTS idx_faculties_is_active ON faculties(is_active);

            -- ==================== DEPARTMENTS ====================
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                faculty_id INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(faculty_id, name)
            );

            CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id);
            CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
            CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

            -- ==================== PROGRAM LEVELS ====================
            CREATE TABLE IF NOT EXISTS program_levels (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                code VARCHAR(20) NOT NULL UNIQUE,
                description TEXT,
                duration_years DECIMAL(3,1), -- e.g., 1.5, 2.0, 3.0, 4.0
                sort_order INTEGER, -- For ordering: Advanced=1, Diploma=2, HND=3, Degree=4, Masters=5
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_program_levels_code ON program_levels(code);
            CREATE INDEX IF NOT EXISTS idx_program_levels_sort_order ON program_levels(sort_order);
            CREATE INDEX IF NOT EXISTS idx_program_levels_is_active ON program_levels(is_active);

            -- ==================== PROGRAMS ====================
            CREATE TABLE IF NOT EXISTS programs (
                id SERIAL PRIMARY KEY,
                department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
                program_level_id INTEGER NOT NULL REFERENCES program_levels(id) ON DELETE RESTRICT,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(department_id, program_level_id, name)
            );

            CREATE INDEX IF NOT EXISTS idx_programs_department_id ON programs(department_id);
            CREATE INDEX IF NOT EXISTS idx_programs_program_level_id ON programs(program_level_id);
            CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
            CREATE INDEX IF NOT EXISTS idx_programs_is_active ON programs(is_active);

            -- ==================== TRIGGERS ====================
            
            -- Faculties trigger
            DROP TRIGGER IF EXISTS update_faculties_updated_at ON faculties;
            CREATE TRIGGER update_faculties_updated_at
                BEFORE UPDATE ON faculties
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Departments trigger
            DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
            CREATE TRIGGER update_departments_updated_at
                BEFORE UPDATE ON departments
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Program Levels trigger
            DROP TRIGGER IF EXISTS update_program_levels_updated_at ON program_levels;
            CREATE TRIGGER update_program_levels_updated_at
                BEFORE UPDATE ON program_levels
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- Programs trigger
            DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
            CREATE TRIGGER update_programs_updated_at
                BEFORE UPDATE ON programs
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            -- ==================== VIEWS ====================

            -- View: Programs with full details
            CREATE OR REPLACE VIEW v_programs_full AS
            SELECT 
                p.id as program_id,
                p.name as program_name,
                p.code as program_code,
                p.description as program_description,
                p.is_active as program_is_active,
                pl.id as level_id,
                pl.name as level_name,
                pl.code as level_code,
                pl.duration_years,
                pl.sort_order as level_sort_order,
                d.id as department_id,
                d.name as department_name,
                d.code as department_code,
                f.id as faculty_id,
                f.name as faculty_name,
                f.code as faculty_code
            FROM programs p
            JOIN program_levels pl ON p.program_level_id = pl.id
            JOIN departments d ON p.department_id = d.id
            JOIN faculties f ON d.faculty_id = f.id
            WHERE p.is_active = TRUE 
            AND d.is_active = TRUE 
            AND f.is_active = TRUE
            AND pl.is_active = TRUE
            ORDER BY f.name, d.name, pl.sort_order, p.name;

            -- View: Department statistics
            CREATE OR REPLACE VIEW v_department_stats AS
            SELECT 
                d.id as department_id,
                d.name as department_name,
                d.code as department_code,
                f.name as faculty_name,
                COUNT(DISTINCT p.id) as total_programs,
                COUNT(DISTINCT u.id) as total_alumni,
                COUNT(DISTINCT CASE WHEN u.graduation_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 5 THEN u.id END) as recent_alumni
            FROM departments d
            JOIN faculties f ON d.faculty_id = f.id
            LEFT JOIN programs p ON d.id = p.department_id AND p.is_active = TRUE
            LEFT JOIN users u ON u.program_of_study = p.name AND u.role = 'alumni'
            WHERE d.is_active = TRUE AND f.is_active = TRUE
            GROUP BY d.id, d.name, d.code, f.name;

            -- View: Faculty statistics
            CREATE OR REPLACE VIEW v_faculty_stats AS
            SELECT 
                f.id as faculty_id,
                f.name as faculty_name,
                f.code as faculty_code,
                COUNT(DISTINCT d.id) as total_departments,
                COUNT(DISTINCT p.id) as total_programs,
                COUNT(DISTINCT u.id) as total_alumni
            FROM faculties f
            LEFT JOIN departments d ON f.id = d.faculty_id AND d.is_active = TRUE
            LEFT JOIN programs p ON d.id = p.department_id AND p.is_active = TRUE
            LEFT JOIN users u ON u.program_of_study = p.name AND u.role = 'alumni'
            WHERE f.is_active = TRUE
            GROUP BY f.id, f.name, f.code;
        `;

        try {
            await pool.query(query);
            console.log("✅ Academic structure tables created successfully with all indexes, triggers, and views!");
            return true;
        } catch (error) {
            console.error("❌ Error creating academic structure tables:", error);
            throw error;
        }
    },

    // Drop all tables
    dropTables: async () => {
        try {
            await pool.query("DROP VIEW IF EXISTS v_programs_full CASCADE;");
            await pool.query("DROP VIEW IF EXISTS v_department_stats CASCADE;");
            await pool.query("DROP VIEW IF EXISTS v_faculty_stats CASCADE;");
            await pool.query("DROP TABLE IF EXISTS programs CASCADE;");
            await pool.query("DROP TABLE IF EXISTS program_levels CASCADE;");
            await pool.query("DROP TABLE IF EXISTS departments CASCADE;");
            await pool.query("DROP TABLE IF EXISTS faculties CASCADE;");
            console.log("✅ Academic structure tables dropped successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error dropping academic structure tables:", error);
            throw error;
        }
    }
};

export default AcademicStructureModel;