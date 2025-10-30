// src/controllers/authController.js
import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const authController = {
    // Register new user (alumni by default)
    register: async (req, res) => {
        try {
            const {
                email,
                password,
                first_name,
                last_name,
                other_name,
                phone_number,
                graduation_year,
                program_of_study,
                major,
                faculty,
                department
            } = req.body;

            // Validate required fields
            if (!email || !password || !first_name || !last_name) {
                return res.status(400).json({
                    success: false,
                    error: "Email, password, first name, and last name are required"
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid email format"
                });
            }

            // Validate password strength
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: "Password must be at least 6 characters long"
                });
            }

            // Check if user already exists
            const userExists = await pool.query(
                "SELECT id FROM users WHERE email = $1",
                [email.toLowerCase()]
            );

            if (userExists.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "User with this email already exists"
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Create user
            const result = await pool.query(
                `INSERT INTO users (
                    email, password_hash, role, first_name, last_name,
                    other_name, phone_number, graduation_year,
                    program_of_study, major, faculty, department
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING 
                    id, email, role, first_name, last_name, other_name,
                    phone_number, graduation_year, program_of_study,
                    major, faculty, department, created_at`,
                [
                    email.toLowerCase(),
                    password_hash,
                    'alumni',
                    first_name,
                    last_name,
                    other_name || null,
                    phone_number || null,
                    graduation_year || null,
                    program_of_study || null,
                    major || null,
                    faculty || null,
                    department || null
                ]
            );

            const user = result.rows[0];

            res.status(201).json({
                success: true,
                message: "Alumni registered successfully",
                data: user
            });

        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({
                success: false,
                error: "Registration failed. Please try again later."
            });
        }
    }
};

export default authController;