// src/controllers/userController.js
import pool from "../config/db.js";

const userController = {
    // Get all users with filters
    getAllUsers: async (req, res) => {
        try {
            const { 
                role, 
                graduation_year, 
                program_of_study, 
                major, 
                faculty,
                search,
                page = 1, 
                limit = 20 
            } = req.query;

            let queryText = `
                SELECT 
                    id, email, role, first_name, last_name, other_name,
                    phone_number, graduation_year, program_of_study, major,
                    faculty, department, current_company, job_title,
                    current_city, current_country, bio, profile_picture,
                    linkedin_url, twitter_url, facebook_url, skills,
                    interests, is_verified, created_at
                FROM users
                WHERE is_active = true
            `;

            const queryParams = [];
            let paramCount = 0;

            if (role) {
                paramCount++;
                queryText += ` AND role = $${paramCount}`;
                queryParams.push(role);
            }

            if (graduation_year) {
                paramCount++;
                queryText += ` AND graduation_year = $${paramCount}`;
                queryParams.push(graduation_year);
            }

            if (program_of_study) {
                paramCount++;
                queryText += ` AND program_of_study ILIKE $${paramCount}`;
                queryParams.push(`%${program_of_study}%`);
            }

            if (major) {
                paramCount++;
                queryText += ` AND major ILIKE $${paramCount}`;
                queryParams.push(`%${major}%`);
            }

            if (faculty) {
                paramCount++;
                queryText += ` AND faculty ILIKE $${paramCount}`;
                queryParams.push(`%${faculty}%`);
            }

            if (search) {
                paramCount++;
                queryText += ` AND (
                    first_name ILIKE $${paramCount} OR 
                    last_name ILIKE $${paramCount} OR 
                    other_name ILIKE $${paramCount} OR
                    email ILIKE $${paramCount} OR
                    current_company ILIKE $${paramCount}
                )`;
                queryParams.push(`%${search}%`);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalUsers = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalUsers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalUsers / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get users error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch users"
            });
        }
    },

    // Get single user by ID
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid user ID"
                });
            }

            const result = await pool.query(
                `SELECT 
                    id, email, role, first_name, last_name, other_name,
                    phone_number, date_of_birth, gender, student_id,
                    graduation_year, program_of_study, major, faculty, department,
                    current_company, job_title, industry, years_of_experience,
                    current_city, current_country, hometown, bio,
                    profile_picture, cover_photo, linkedin_url, twitter_url,
                    facebook_url, website_url, skills, interests, is_verified,
                    profile_visibility, show_email, show_phone,
                    created_at, updated_at
                FROM users 
                WHERE id = $1 AND is_active = true`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get user error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch user"
            });
        }
    },

    // Update user profile
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid user ID"
                });
            }

            // Check if user exists
            const userCheck = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND is_active = true",
                [id]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            // Allowed fields to update
            const allowedFields = [
                'first_name', 'last_name', 'other_name', 'phone_number',
                'date_of_birth', 'gender', 'graduation_year', 'program_of_study',
                'major', 'faculty', 'department', 'current_company', 'job_title',
                'industry', 'years_of_experience', 'current_city', 'current_country',
                'hometown', 'bio', 'profile_picture', 'cover_photo', 'linkedin_url',
                'twitter_url', 'facebook_url', 'website_url', 'skills', 'interests',
                'profile_visibility', 'show_email', 'show_phone'
            ];

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

            const queryText = `
                UPDATE users 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING 
                    id, email, role, first_name, last_name, other_name,
                    phone_number, graduation_year, program_of_study, major,
                    faculty, department, current_company, job_title,
                    current_city, bio, profile_picture, linkedin_url, updated_at
            `;

            const result = await pool.query(queryText, values);

            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update user error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update user"
            });
        }
    },

    // Update password
    updatePassword: async (req, res) => {
        try {
            const { id } = req.params;
            const { current_password, new_password } = req.body;

            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    error: "Current password and new password are required"
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: "New password must be at least 6 characters long"
                });
            }

            const userResult = await pool.query(
                "SELECT id, password_hash FROM users WHERE id = $1 AND is_active = true",
                [id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            const user = userResult.rows[0];
            const bcrypt = await import("bcryptjs");
            const isMatch = await bcrypt.default.compare(current_password, user.password_hash);
            
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    error: "Current password is incorrect"
                });
            }

            const salt = await bcrypt.default.genSalt(10);
            const new_password_hash = await bcrypt.default.hash(new_password, salt);

            await pool.query(
                "UPDATE users SET password_hash = $1 WHERE id = $2",
                [new_password_hash, id]
            );

            res.status(200).json({
                success: true,
                message: "Password updated successfully"
            });

        } catch (error) {
            console.error("Update password error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update password"
            });
        }
    },

    // Delete user (soft delete)
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid user ID"
                });
            }

            const userCheck = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND is_active = true",
                [id]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            await pool.query(
                "UPDATE users SET is_active = false WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "User account deactivated successfully"
            });

        } catch (error) {
            console.error("Delete user error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete user"
            });
        }
    },

    // Reactivate user
    reactivateUser: async (req, res) => {
        try {
            const { id } = req.params;

            const userCheck = await pool.query(
                "SELECT id, is_active FROM users WHERE id = $1",
                [id]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            if (userCheck.rows[0].is_active) {
                return res.status(400).json({
                    success: false,
                    error: "User account is already active"
                });
            }

            await pool.query(
                "UPDATE users SET is_active = true WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "User account reactivated successfully"
            });

        } catch (error) {
            console.error("Reactivate user error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to reactivate user"
            });
        }
    },

    // Get user statistics
    getUserStats: async (req, res) => {
        try {
            const totalResult = await pool.query(
                "SELECT COUNT(*) as total FROM users WHERE is_active = true"
            );

            const roleResult = await pool.query(
                `SELECT role, COUNT(*) as count 
                 FROM users 
                 WHERE is_active = true 
                 GROUP BY role`
            );

            const yearResult = await pool.query(
                `SELECT graduation_year, COUNT(*) as count 
                 FROM users 
                 WHERE is_active = true AND graduation_year IS NOT NULL 
                 GROUP BY graduation_year 
                 ORDER BY graduation_year DESC 
                 LIMIT 10`
            );

            const facultyResult = await pool.query(
                `SELECT faculty, COUNT(*) as count 
                 FROM users 
                 WHERE is_active = true AND faculty IS NOT NULL 
                 GROUP BY faculty 
                 ORDER BY count DESC 
                 LIMIT 10`
            );

            const recentResult = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM users 
                 WHERE is_active = true 
                 AND created_at >= NOW() - INTERVAL '30 days'`
            );

            res.status(200).json({
                success: true,
                data: {
                    total_users: parseInt(totalResult.rows[0].total),
                    by_role: roleResult.rows,
                    by_graduation_year: yearResult.rows,
                    by_faculty: facultyResult.rows,
                    recent_registrations: parseInt(recentResult.rows[0].count)
                }
            });

        } catch (error) {
            console.error("Get stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch statistics"
            });
        }
    }
};

export default userController;