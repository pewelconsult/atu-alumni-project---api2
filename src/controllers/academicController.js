// src/controllers/academicController.js
import pool from "../config/db.js";

const academicController = {
    // ==================== PROGRAM LEVELS ====================

    // Get all program levels
    getAllProgramLevels: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT * FROM program_levels
                WHERE is_active = true
                ORDER BY sort_order ASC
            `);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error("Get program levels error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch program levels"
            });
        }
    },

    // ==================== FACULTIES ====================

    // Get all faculties
    getAllFaculties: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT * FROM faculties
                WHERE is_active = true
                ORDER BY name ASC
            `);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error("Get faculties error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch faculties"
            });
        }
    },

    // Get single faculty with departments
    getFacultyById: async (req, res) => {
        try {
            const { id } = req.params;

            // Get faculty
            const facultyResult = await pool.query(
                "SELECT * FROM faculties WHERE id = $1 AND is_active = true",
                [id]
            );

            if (facultyResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Faculty not found"
                });
            }

            // Get departments in this faculty
            const departmentsResult = await pool.query(`
                SELECT 
                    d.*,
                    COUNT(p.id) as program_count
                FROM departments d
                LEFT JOIN programs p ON d.id = p.department_id AND p.is_active = true
                WHERE d.faculty_id = $1 AND d.is_active = true
                GROUP BY d.id
                ORDER BY d.name ASC
            `, [id]);

            res.status(200).json({
                success: true,
                data: {
                    ...facultyResult.rows[0],
                    departments: departmentsResult.rows
                }
            });
        } catch (error) {
            console.error("Get faculty error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch faculty"
            });
        }
    },

    // Get faculty statistics
    getFacultyStats: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT * FROM v_faculty_stats
                ORDER BY faculty_name ASC
            `);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error("Get faculty stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch faculty statistics"
            });
        }
    },

    // Create faculty (Admin)
    createFaculty: async (req, res) => {
        try {
            const { name, code, description } = req.body;

            if (!name || !code) {
                return res.status(400).json({
                    success: false,
                    error: "Name and code are required"
                });
            }

            const result = await pool.query(
                `INSERT INTO faculties (name, code, description)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [name, code, description || null]
            );

            res.status(201).json({
                success: true,
                message: "Faculty created successfully",
                data: result.rows[0]
            });
        } catch (error) {
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: "Faculty with this name or code already exists"
                });
            }
            console.error("Create faculty error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create faculty"
            });
        }
    },

    // Update faculty (Admin)
    updateFaculty: async (req, res) => {
        try {
            const { id } = req.params;
            const allowedFields = ['name', 'code', 'description', 'is_active'];

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

            const result = await pool.query(
                `UPDATE faculties SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Faculty not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Faculty updated successfully",
                data: result.rows[0]
            });
        } catch (error) {
            console.error("Update faculty error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update faculty"
            });
        }
    },

    // ==================== DEPARTMENTS ====================

    // Get all departments
    getAllDepartments: async (req, res) => {
        try {
            const { faculty_id } = req.query;

            let queryText = `
                SELECT 
                    d.*,
                    f.name as faculty_name,
                    f.code as faculty_code,
                    COUNT(p.id) as program_count
                FROM departments d
                JOIN faculties f ON d.faculty_id = f.id
                LEFT JOIN programs p ON d.id = p.department_id AND p.is_active = true
                WHERE d.is_active = true
            `;

            const queryParams = [];
            if (faculty_id) {
                queryParams.push(faculty_id);
                queryText += ` AND d.faculty_id = $1`;
            }

            queryText += ` GROUP BY d.id, f.name, f.code ORDER BY f.name, d.name ASC`;

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error("Get departments error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch departments"
            });
        }
    },

    // Get single department with programs
    getDepartmentById: async (req, res) => {
        try {
            const { id } = req.params;

            // Get department
            const deptResult = await pool.query(`
                SELECT 
                    d.*,
                    f.name as faculty_name,
                    f.code as faculty_code
                FROM departments d
                JOIN faculties f ON d.faculty_id = f.id
                WHERE d.id = $1 AND d.is_active = true
            `, [id]);

            if (deptResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Department not found"
                });
            }

            // Get programs in this department
            const programsResult = await pool.query(`
                SELECT 
                    p.*,
                    pl.name as level_name,
                    pl.code as level_code,
                    pl.duration_years
                FROM programs p
                JOIN program_levels pl ON p.program_level_id = pl.id
                WHERE p.department_id = $1 AND p.is_active = true
                ORDER BY pl.sort_order ASC, p.name ASC
            `, [id]);

            res.status(200).json({
                success: true,
                data: {
                    ...deptResult.rows[0],
                    programs: programsResult.rows
                }
            });
        } catch (error) {
            console.error("Get department error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch department"
            });
        }
    },

    // Get department statistics
    getDepartmentStats: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT * FROM v_department_stats
                ORDER BY faculty_name, department_name ASC
            `);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error("Get department stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch department statistics"
            });
        }
    },

    // Create department (Admin)
    createDepartment: async (req, res) => {
        try {
            const { faculty_id, name, code, description } = req.body;

            if (!faculty_id || !name || !code) {
                return res.status(400).json({
                    success: false,
                    error: "Faculty ID, name, and code are required"
                });
            }

            const result = await pool.query(
                `INSERT INTO departments (faculty_id, name, code, description)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [faculty_id, name, code, description || null]
            );

            res.status(201).json({
                success: true,
                message: "Department created successfully",
                data: result.rows[0]
            });
        } catch (error) {
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: "Department with this code already exists"
                });
            }
            console.error("Create department error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create department"
            });
        }
    },

    // Update department (Admin)
    updateDepartment: async (req, res) => {
        try {
            const { id } = req.params;
            const allowedFields = ['faculty_id', 'name', 'code', 'description', 'is_active'];

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

            const result = await pool.query(
                `UPDATE departments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Department not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Department updated successfully",
                data: result.rows[0]
            });
        } catch (error) {
            console.error("Update department error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update department"
            });
        }
    },

    // ==================== PROGRAMS ====================

    // Get all programs
    getAllPrograms: async (req, res) => {
        try {
            const { faculty_id, department_id, level_id } = req.query;

            let queryText = `
                SELECT * FROM v_programs_full
                WHERE program_is_active = true
            `;

            const queryParams = [];
            let paramCount = 0;

            if (faculty_id) {
                paramCount++;
                queryText += ` AND faculty_id = $${paramCount}`;
                queryParams.push(faculty_id);
            }

            if (department_id) {
                paramCount++;
                queryText += ` AND department_id = $${paramCount}`;
                queryParams.push(department_id);
            }

            if (level_id) {
                paramCount++;
                queryText += ` AND level_id = $${paramCount}`;
                queryParams.push(level_id);
            }

            queryText += ` ORDER BY faculty_name, department_name, level_sort_order, program_name`;

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error("Get programs error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch programs"
            });
        }
    },

    // Get single program
    getProgramById: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "SELECT * FROM v_programs_full WHERE program_id = $1",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Program not found"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error("Get program error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch program"
            });
        }
    },

    // Create program (Admin)
    createProgram: async (req, res) => {
        try {
            const { department_id, program_level_id, name, code, description } = req.body;

            if (!department_id || !program_level_id || !name || !code) {
                return res.status(400).json({
                    success: false,
                    error: "Department ID, program level ID, name, and code are required"
                });
            }

            const result = await pool.query(
                `INSERT INTO programs (department_id, program_level_id, name, code, description)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [department_id, program_level_id, name, code, description || null]
            );

            res.status(201).json({
                success: true,
                message: "Program created successfully",
                data: result.rows[0]
            });
        } catch (error) {
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: "Program with this code already exists"
                });
            }
            console.error("Create program error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create program"
            });
        }
    },

    // Update program (Admin)
    updateProgram: async (req, res) => {
        try {
            const { id } = req.params;
            const allowedFields = ['department_id', 'program_level_id', 'name', 'code', 'description', 'is_active'];

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

            const result = await pool.query(
                `UPDATE programs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Program not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Program updated successfully",
                data: result.rows[0]
            });
        } catch (error) {
            console.error("Update program error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update program"
            });
        }
    },

    // Delete program (Admin)
    deleteProgram: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "DELETE FROM programs WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Program not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Program deleted successfully"
            });
        } catch (error) {
            console.error("Delete program error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete program"
            });
        }
    },

    // ==================== DROPDOWN DATA ====================

    // Get data for dropdowns (for forms like tracer study)
    getDropdownData: async (req, res) => {
        try {
            // Get all active program levels
            const levels = await pool.query(`
                SELECT id, name, code, sort_order
                FROM program_levels
                WHERE is_active = true
                ORDER BY sort_order ASC
            `);

            // Get all active faculties
            const faculties = await pool.query(`
                SELECT id, name, code
                FROM faculties
                WHERE is_active = true
                ORDER BY name ASC
            `);

            // Get all active departments with faculty info
            const departments = await pool.query(`
                SELECT 
                    d.id, 
                    d.name, 
                    d.code,
                    d.faculty_id,
                    f.name as faculty_name
                FROM departments d
                JOIN faculties f ON d.faculty_id = f.id
                WHERE d.is_active = true
                ORDER BY f.name, d.name ASC
            `);

            // Get all active programs with full hierarchy
            const programs = await pool.query(`
                SELECT 
                    program_id as id,
                    program_name as name,
                    program_code as code,
                    level_name,
                    department_id,
                    department_name,
                    faculty_id,
                    faculty_name
                FROM v_programs_full
                ORDER BY faculty_name, department_name, level_sort_order, program_name
            `);

            res.status(200).json({
                success: true,
                data: {
                    program_levels: levels.rows,
                    faculties: faculties.rows,
                    departments: departments.rows,
                    programs: programs.rows
                }
            });
        } catch (error) {
            console.error("Get dropdown data error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch dropdown data"
            });
        }
    }
};

export default academicController;