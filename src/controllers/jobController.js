// src/controllers/jobController.js
import pool from "../config/db.js";

const jobController = {
    // Create new job (Admin only)
    createJob: async (req, res) => {
        try {
            const {
                posted_by,
                company_name,
                company_logo,
                company_website,
                industry,
                job_title,
                job_description,
                job_type,
                location,
                location_type,
                salary_min,
                salary_max,
                salary_currency,
                salary_period,
                experience_level,
                education_required,
                skills_required,
                responsibilities,
                qualifications,
                benefits,
                application_deadline,
                application_url,
                application_email,
                positions_available,
                is_featured
            } = req.body;

            // Validate required fields
            if (!posted_by || !company_name || !job_title || !job_description || !job_type || !location) {
                return res.status(400).json({
                    success: false,
                    error: "Posted by, company name, job title, description, job type, and location are required"
                });
            }

            // Validate job_type
            const validJobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
            if (!validJobTypes.includes(job_type)) {
                return res.status(400).json({
                    success: false,
                    error: `Job type must be one of: ${validJobTypes.join(', ')}`
                });
            }

            // Check if posted_by user exists and is admin
            const userCheck = await pool.query(
                "SELECT id, role FROM users WHERE id = $1 AND is_active = true",
                [posted_by]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            // Create job
            const result = await pool.query(
                `INSERT INTO jobs (
                    posted_by, company_name, company_logo, company_website, industry,
                    job_title, job_description, job_type, location, location_type,
                    salary_min, salary_max, salary_currency, salary_period,
                    experience_level, education_required, skills_required,
                    responsibilities, qualifications, benefits,
                    application_deadline, application_url, application_email,
                    positions_available, is_featured
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
                RETURNING *`,
                [
                    posted_by, company_name, company_logo || null, company_website || null, industry || null,
                    job_title, job_description, job_type, location, location_type || null,
                    salary_min || null, salary_max || null, salary_currency || 'GHS', salary_period || null,
                    experience_level || null, education_required || null, skills_required || null,
                    responsibilities || null, qualifications || null, benefits || null,
                    application_deadline || null, application_url || null, application_email || null,
                    positions_available || 1, is_featured || false
                ]
            );

            res.status(201).json({
                success: true,
                message: "Job created successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Create job error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create job"
            });
        }
    },

    // Get all jobs with filters
    getAllJobs: async (req, res) => {
        try {
            const {
                job_type,
                location,
                location_type,
                experience_level,
                industry,
                company_name,
                salary_min,
                salary_max,
                skills,
                is_featured,
                posted_within_days,
                search,
                page = 1,
                limit = 20,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = req.query;

            let queryText = `
                SELECT 
                    j.*,
                    u.first_name || ' ' || u.last_name as posted_by_name,
                    u.email as posted_by_email
                FROM jobs j
                LEFT JOIN users u ON j.posted_by = u.id
                WHERE j.is_active = true
            `;

            const queryParams = [];
            let paramCount = 0;

            // Filters
            if (job_type) {
                paramCount++;
                queryText += ` AND j.job_type = $${paramCount}`;
                queryParams.push(job_type);
            }

            if (location) {
                paramCount++;
                queryText += ` AND j.location ILIKE $${paramCount}`;
                queryParams.push(`%${location}%`);
            }

            if (location_type) {
                paramCount++;
                queryText += ` AND j.location_type = $${paramCount}`;
                queryParams.push(location_type);
            }

            if (experience_level) {
                paramCount++;
                queryText += ` AND j.experience_level = $${paramCount}`;
                queryParams.push(experience_level);
            }

            if (industry) {
                paramCount++;
                queryText += ` AND j.industry ILIKE $${paramCount}`;
                queryParams.push(`%${industry}%`);
            }

            if (company_name) {
                paramCount++;
                queryText += ` AND j.company_name ILIKE $${paramCount}`;
                queryParams.push(`%${company_name}%`);
            }

            if (salary_min) {
                paramCount++;
                queryText += ` AND j.salary_max >= $${paramCount}`;
                queryParams.push(salary_min);
            }

            if (salary_max) {
                paramCount++;
                queryText += ` AND j.salary_min <= $${paramCount}`;
                queryParams.push(salary_max);
            }

            if (skills) {
                paramCount++;
                queryText += ` AND j.skills_required && $${paramCount}`;
                queryParams.push(`{${skills}}`);
            }

            if (is_featured === 'true') {
                queryText += ` AND j.is_featured = true`;
            }

            if (posted_within_days) {
                paramCount++;
                queryText += ` AND j.created_at >= NOW() - INTERVAL '${parseInt(posted_within_days)} days'`;
            }

            if (search) {
                paramCount++;
                queryText += ` AND (
                    j.job_title ILIKE $${paramCount} OR 
                    j.job_description ILIKE $${paramCount} OR 
                    j.company_name ILIKE $${paramCount}
                )`;
                queryParams.push(`%${search}%`);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalJobs = parseInt(countResult.rows[0].count);

            // Add sorting and pagination
            const validSortFields = ['created_at', 'job_title', 'salary_min', 'application_deadline', 'views_count'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
            const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            const offset = (page - 1) * limit;
            queryText += ` ORDER BY j.${sortField} ${order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalJobs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalJobs / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get jobs error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch jobs"
            });
        }
    },

    // Get single job by ID
    getJobById: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid job ID"
                });
            }

            const result = await pool.query(
                `SELECT 
                    j.*,
                    u.first_name || ' ' || u.last_name as posted_by_name,
                    u.email as posted_by_email,
                    u.role as posted_by_role
                FROM jobs j
                LEFT JOIN users u ON j.posted_by = u.id
                WHERE j.id = $1 AND j.is_active = true`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Job not found"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get job error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch job"
            });
        }
    },

    // Update job
    updateJob: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid job ID"
                });
            }

            // Check if job exists
            const jobCheck = await pool.query(
                "SELECT id FROM jobs WHERE id = $1",
                [id]
            );

            if (jobCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Job not found"
                });
            }

            // Allowed fields to update
            const allowedFields = [
                'company_name', 'company_logo', 'company_website', 'industry',
                'job_title', 'job_description', 'job_type', 'location', 'location_type',
                'salary_min', 'salary_max', 'salary_currency', 'salary_period',
                'experience_level', 'education_required', 'skills_required',
                'responsibilities', 'qualifications', 'benefits',
                'application_deadline', 'application_url', 'application_email',
                'positions_available', 'is_featured', 'is_active'
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
                UPDATE jobs 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(queryText, values);

            res.status(200).json({
                success: true,
                message: "Job updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update job error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update job"
            });
        }
    },

    // Delete job (soft delete)
    deleteJob: async (req, res) => {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid job ID"
                });
            }

            const jobCheck = await pool.query(
                "SELECT id FROM jobs WHERE id = $1",
                [id]
            );

            if (jobCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Job not found"
                });
            }

            await pool.query(
                "UPDATE jobs SET is_active = false WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "Job deleted successfully"
            });

        } catch (error) {
            console.error("Delete job error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete job"
            });
        }
    },

    // Increment view count
    incrementViewCount: async (req, res) => {
        try {
            const { id } = req.params;

            await pool.query(
                "UPDATE jobs SET views_count = views_count + 1 WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "View count updated"
            });

        } catch (error) {
            console.error("Increment view error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update view count"
            });
        }
    },

    // Apply to job
    applyToJob: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, cover_letter, resume_url } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if job exists and is active
            const jobCheck = await pool.query(
                "SELECT id, application_deadline FROM jobs WHERE id = $1 AND is_active = true",
                [id]
            );

            if (jobCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Job not found or no longer active"
                });
            }

            // Check if deadline has passed
            const job = jobCheck.rows[0];
            if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
                return res.status(400).json({
                    success: false,
                    error: "Application deadline has passed"
                });
            }

            // Check if user already applied
            const existingApplication = await pool.query(
                "SELECT id FROM job_applications WHERE job_id = $1 AND user_id = $2",
                [id, user_id]
            );

            if (existingApplication.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "You have already applied to this job"
                });
            }

            // Create application
            const result = await pool.query(
                `INSERT INTO job_applications (job_id, user_id, cover_letter, resume_url)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [id, user_id, cover_letter || null, resume_url || null]
            );

            res.status(201).json({
                success: true,
                message: "Application submitted successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Apply to job error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to submit application"
            });
        }
    },

    // Get user's applications
    getMyApplications: async (req, res) => {
        try {
            const { user_id } = req.query;
            const { status, page = 1, limit = 20 } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            let queryText = `
                SELECT 
                    ja.*,
                    j.job_title,
                    j.company_name,
                    j.company_logo,
                    j.location,
                    j.job_type,
                    j.is_active as job_is_active
                FROM job_applications ja
                JOIN jobs j ON ja.job_id = j.id
                WHERE ja.user_id = $1
            `;

            const queryParams = [user_id];
            let paramCount = 1;

            if (status) {
                paramCount++;
                queryText += ` AND ja.status = $${paramCount}`;
                queryParams.push(status);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalApplications = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            queryText += ` ORDER BY ja.applied_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalApplications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalApplications / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get applications error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch applications"
            });
        }
    },

    // Get job applications (for admin)
    getJobApplications: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, page = 1, limit = 20 } = req.query;

            let queryText = `
                SELECT 
                    ja.*,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone_number,
                    u.graduation_year,
                    u.program_of_study,
                    u.current_company,
                    u.linkedin_url
                FROM job_applications ja
                JOIN users u ON ja.user_id = u.id
                WHERE ja.job_id = $1
            `;

            const queryParams = [id];
            let paramCount = 1;

            if (status) {
                paramCount++;
                queryText += ` AND ja.status = $${paramCount}`;
                queryParams.push(status);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalApplications = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            queryText += ` ORDER BY ja.applied_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalApplications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalApplications / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get job applications error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch applications"
            });
        }
    },

    // Update application status
    updateApplicationStatus: async (req, res) => {
        try {
            const { id, appId } = req.params;
            const { status, notes, reviewed_by } = req.body;

            const validStatuses = ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted', 'withdrawn'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }

            const result = await pool.query(
                `UPDATE job_applications 
                 SET status = $1, notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
                 WHERE id = $4 AND job_id = $5
                 RETURNING *`,
                [status, notes || null, reviewed_by || null, appId, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Application not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Application status updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update application status error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update application status"
            });
        }
    },

    // Save job
    saveJob: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if job exists
            const jobCheck = await pool.query(
                "SELECT id FROM jobs WHERE id = $1 AND is_active = true",
                [id]
            );

            if (jobCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Job not found"
                });
            }

            // Check if already saved
            const existingSave = await pool.query(
                "SELECT id FROM saved_jobs WHERE job_id = $1 AND user_id = $2",
                [id, user_id]
            );

            if (existingSave.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Job already saved"
                });
            }

            // Save job
            const result = await pool.query(
                "INSERT INTO saved_jobs (job_id, user_id) VALUES ($1, $2) RETURNING *",
                [id, user_id]
            );

            res.status(201).json({
                success: true,
                message: "Job saved successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Save job error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to save job"
            });
        }
    },

    // Unsave job
    unsaveJob: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "DELETE FROM saved_jobs WHERE job_id = $1 AND user_id = $2 RETURNING *",
                [id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Saved job not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Job unsaved successfully"
            });

        } catch (error) {
            console.error("Unsave job error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unsave job"
            });
        }
    },

    // Get saved jobs
    getSavedJobs: async (req, res) => {
        try {
            const { user_id } = req.query;
            const { page = 1, limit = 20 } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const queryText = `
                SELECT 
                    sj.id as saved_id,
                    sj.saved_at,
                    j.*
                FROM saved_jobs sj
                JOIN jobs j ON sj.job_id = j.id
                WHERE sj.user_id = $1 AND j.is_active = true
            `;

            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM saved_jobs sj
                 JOIN jobs j ON sj.job_id = j.id
                 WHERE sj.user_id = $1 AND j.is_active = true`,
                [user_id]
            );
            const totalSaved = parseInt(countResult.rows[0].count);

            // Add pagination
            const offset = (page - 1) * limit;
            const paginatedQuery = `${queryText} ORDER BY sj.saved_at DESC LIMIT $2 OFFSET $3`;
            const result = await pool.query(paginatedQuery, [user_id, limit, offset]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalSaved,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalSaved / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get saved jobs error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch saved jobs"
            });
        }
    },

    // Get job statistics
    getJobStats: async (req, res) => {
        try {
            // Total jobs
            const totalResult = await pool.query(
                "SELECT COUNT(*) as total FROM jobs WHERE is_active = true"
            );

            // Jobs by type
            const typeResult = await pool.query(
                `SELECT job_type, COUNT(*) as count 
                 FROM jobs 
                 WHERE is_active = true 
                 GROUP BY job_type 
                 ORDER BY count DESC`
            );

            // Jobs by location
            const locationResult = await pool.query(
                `SELECT location, COUNT(*) as count 
                 FROM jobs 
                 WHERE is_active = true 
                 GROUP BY location 
                 ORDER BY count DESC 
                 LIMIT 10`
            );

            // Top companies
            const companiesResult = await pool.query(
                `SELECT company_name, COUNT(*) as job_count 
                 FROM jobs 
                 WHERE is_active = true 
                 GROUP BY company_name 
                 ORDER BY job_count DESC 
                 LIMIT 10`
            );

            // Total applications
            const applicationsResult = await pool.query(
                "SELECT COUNT(*) as total FROM job_applications"
            );

            // Applications by status
            const statusResult = await pool.query(
                `SELECT status, COUNT(*) as count 
                 FROM job_applications 
                 GROUP BY status 
                 ORDER BY count DESC`
            );

            // Recent jobs (last 30 days)
            const recentResult = await pool.query(
                `SELECT COUNT(*) as count 
                 FROM jobs 
                 WHERE is_active = true 
                 AND created_at >= NOW() - INTERVAL '30 days'`
            );

            // Most viewed jobs
            const viewedResult = await pool.query(
                `SELECT id, job_title, company_name, views_count 
                 FROM jobs 
                 WHERE is_active = true 
                 ORDER BY views_count DESC 
                 LIMIT 10`
            );

            // Most applied jobs
            const appliedResult = await pool.query(
                `SELECT id, job_title, company_name, applications_count 
                 FROM jobs 
                 WHERE is_active = true 
                 ORDER BY applications_count DESC 
                 LIMIT 10`
            );

            res.status(200).json({
                success: true,
                data: {
                    total_jobs: parseInt(totalResult.rows[0].total),
                    total_applications: parseInt(applicationsResult.rows[0].total),
                    recent_jobs_30_days: parseInt(recentResult.rows[0].count),
                    by_job_type: typeResult.rows,
                    by_location: locationResult.rows,
                    top_companies: companiesResult.rows,
                    applications_by_status: statusResult.rows,
                    most_viewed_jobs: viewedResult.rows,
                    most_applied_jobs: appliedResult.rows
                }
            });

        } catch (error) {
            console.error("Get job stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch job statistics"
            });
        }
    }
};


const checkJobOwnership = async (jobId, userId, isAdmin) => {
    const result = await pool.query(
        "SELECT posted_by FROM jobs WHERE id = $1",
        [jobId]
    );
    
    if (result.rows.length === 0) {
        return { exists: false, isOwner: false };
    }
    
    const isOwner = result.rows[0].posted_by === parseInt(userId);
    return { 
        exists: true, 
        isOwner: isOwner || isAdmin 
    };
};

export default jobController;