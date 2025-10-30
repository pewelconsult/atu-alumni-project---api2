// src/controllers/tracerStudyController.js
import pool from "../config/db.js";

const tracerStudyController = {
    // ==================== RESPONSES ====================

    // Get all tracer study responses (Admin)
    getAllResponses: async (req, res) => {
        try {
            const {
                programme,
                year,
                current_status,
                sector,
                page = 1,
                limit = 20,
                sort_by = 'submitted_at',
                sort_order = 'DESC'
            } = req.query;

            let queryText = `
                SELECT 
                    tsr.*,
                    u.first_name || ' ' || u.last_name as user_name,
                    u.email as user_email
                FROM tracer_study_responses tsr
                LEFT JOIN users u ON tsr.user_id = u.id
                WHERE tsr.is_completed = true
            `;

            const queryParams = [];
            let paramCount = 0;

            // Filters
            if (programme) {
                paramCount++;
                queryText += ` AND tsr.programme_of_study = $${paramCount}`;
                queryParams.push(programme);
            }

            if (year) {
                paramCount++;
                queryText += ` AND tsr.year_of_graduation = $${paramCount}`;
                queryParams.push(year);
            }

            if (current_status) {
                paramCount++;
                queryText += ` AND tsr.current_status = $${paramCount}`;
                queryParams.push(current_status);
            }

            if (sector) {
                paramCount++;
                queryText += ` AND tsr.sector = $${paramCount}`;
                queryParams.push(sector);
            }

            // Get total count
            const countQueryText = queryText.replace(
                /SELECT[\s\S]*?FROM/i,
                'SELECT COUNT(*) FROM'
            );
            const countResult = await pool.query(countQueryText, queryParams);
            const totalResponses = parseInt(countResult.rows[0].count);

            // Add sorting and pagination
            const validSortFields = [
                'submitted_at', 'created_at', 'year_of_graduation', 
                'full_name', 'programme_of_study', 'current_status'
            ];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'submitted_at';
            const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            queryText += ` ORDER BY tsr.${sortField} ${order}`;

            const offset = (page - 1) * limit;
            paramCount++;
            queryText += ` LIMIT $${paramCount}`;
            queryParams.push(limit);

            paramCount++;
            queryText += ` OFFSET $${paramCount}`;
            queryParams.push(offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalResponses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalResponses / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get responses error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch tracer study responses"
            });
        }
    },

    // Get single response by ID
    getResponseById: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `SELECT 
                    tsr.*,
                    u.first_name || ' ' || u.last_name as user_name,
                    u.profile_picture as user_picture
                FROM tracer_study_responses tsr
                LEFT JOIN users u ON tsr.user_id = u.id
                WHERE tsr.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Response not found"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get response error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch response"
            });
        }
    },

    // Get user's own response
    getMyResponse: async (req, res) => {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "SELECT * FROM tracer_study_responses WHERE user_id = $1",
                [user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "No response found for this user",
                    has_submitted: false
                });
            }

            res.status(200).json({
                success: true,
                has_submitted: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get my response error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch your response"
            });
        }
    },

    // Check if user has submitted
    checkSubmissionStatus: async (req, res) => {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "SELECT id, submitted_at FROM tracer_study_responses WHERE user_id = $1",
                [user_id]
            );

            res.status(200).json({
                success: true,
                has_submitted: result.rows.length > 0,
                submission_date: result.rows.length > 0 ? result.rows[0].submitted_at : null
            });

        } catch (error) {
            console.error("Check submission status error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to check submission status"
            });
        }
    },

    // Submit tracer study response
    submitResponse: async (req, res) => {
        try {
            const {
                user_id,
                // Section 1
                full_name,
                index_number,
                programme_of_study,
                year_of_graduation,
                email,
                phone_number,
                // Section 2
                current_status,
                time_to_first_job,
                main_challenge,
                // Section 3 (conditional)
                job_title,
                employer_name,
                sector,
                job_related_to_field,
                monthly_income_range,
                how_found_job,
                job_level,
                // Section 4
                skills_relevance_rating,
                skills_to_strengthen,
                job_satisfaction_rating,
                // Section 5
                programme_quality_rating,
                internship_support_satisfaction,
                would_recommend_atu,
                // Section 6
                is_alumni_member,
                willing_to_mentor,
                preferred_contact_method,
                willing_to_collaborate
            } = req.body;

            // Validate required fields
            if (!user_id || !full_name || !index_number || !programme_of_study || 
                !year_of_graduation || !email || !phone_number || !current_status) {
                return res.status(400).json({
                    success: false,
                    error: "Required fields are missing"
                });
            }

            // Check if user already submitted
            const existingResponse = await pool.query(
                "SELECT id FROM tracer_study_responses WHERE user_id = $1",
                [user_id]
            );

            if (existingResponse.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "You have already submitted a tracer study response"
                });
            }

            // Validate employment-related fields if employed/self-employed
            if (['Employed', 'Self-employed'].includes(current_status)) {
                if (!job_title || !employer_name || !sector) {
                    return res.status(400).json({
                        success: false,
                        error: "Job title, employer name, and sector are required for employed/self-employed status"
                    });
                }
            }

            const result = await pool.query(
                `INSERT INTO tracer_study_responses (
                    user_id,
                    full_name, index_number, programme_of_study, year_of_graduation, email, phone_number,
                    current_status, time_to_first_job, main_challenge,
                    job_title, employer_name, sector, job_related_to_field, monthly_income_range, 
                    how_found_job, job_level,
                    skills_relevance_rating, skills_to_strengthen, job_satisfaction_rating,
                    programme_quality_rating, internship_support_satisfaction, would_recommend_atu,
                    is_alumni_member, willing_to_mentor, preferred_contact_method, willing_to_collaborate
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17,
                    $18, $19, $20, $21, $22, $23,
                    $24, $25, $26, $27
                )
                RETURNING *`,
                [
                    user_id,
                    full_name, index_number, programme_of_study, year_of_graduation, email, phone_number,
                    current_status, time_to_first_job || null, main_challenge || null,
                    job_title || null, employer_name || null, sector || null, 
                    job_related_to_field || null, monthly_income_range || null,
                    how_found_job || null, job_level || null,
                    skills_relevance_rating || null, skills_to_strengthen || null, 
                    job_satisfaction_rating || null,
                    programme_quality_rating || null, internship_support_satisfaction || null, 
                    would_recommend_atu || null,
                    is_alumni_member || false, willing_to_mentor || false, 
                    preferred_contact_method || null, willing_to_collaborate || false
                ]
            );

            res.status(201).json({
                success: true,
                message: "Tracer study response submitted successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Submit response error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to submit tracer study response"
            });
        }
    },

    // Update tracer study response
    updateResponse: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            // Check if response exists and user owns it
            const responseCheck = await pool.query(
                "SELECT user_id FROM tracer_study_responses WHERE id = $1",
                [id]
            );

            if (responseCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Response not found"
                });
            }

            if (responseCheck.rows[0].user_id !== user_id) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have permission to update this response"
                });
            }

            const allowedFields = [
                'full_name', 'index_number', 'programme_of_study', 'year_of_graduation', 
                'email', 'phone_number', 'current_status', 'time_to_first_job', 'main_challenge',
                'job_title', 'employer_name', 'sector', 'job_related_to_field', 
                'monthly_income_range', 'how_found_job', 'job_level',
                'skills_relevance_rating', 'skills_to_strengthen', 'job_satisfaction_rating',
                'programme_quality_rating', 'internship_support_satisfaction', 'would_recommend_atu',
                'is_alumni_member', 'willing_to_mentor', 'preferred_contact_method', 
                'willing_to_collaborate'
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
                UPDATE tracer_study_responses 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(queryText, values);

            res.status(200).json({
                success: true,
                message: "Response updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update response error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update response"
            });
        }
    },

    // Delete response (Admin only)
    deleteResponse: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "DELETE FROM tracer_study_responses WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Response not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Response deleted successfully"
            });

        } catch (error) {
            console.error("Delete response error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete response"
            });
        }
    },

    // ==================== ANALYTICS ====================

    // Get overall analytics
    getAnalytics: async (req, res) => {
        try {
            // Get basic analytics from view
            const analyticsResult = await pool.query(
                "SELECT * FROM tracer_study_analytics"
            );

            // Get employment rate by programme
            const employmentByProgramme = await pool.query(`
                SELECT 
                    programme_of_study,
                    COUNT(*) as total_responses,
                    COUNT(CASE WHEN current_status IN ('Employed', 'Self-employed') THEN 1 END) as employed_count,
                    ROUND(
                        COUNT(CASE WHEN current_status IN ('Employed', 'Self-employed') THEN 1 END)::numeric / 
                        COUNT(*)::numeric * 100, 
                        2
                    ) as employment_rate
                FROM tracer_study_responses
                WHERE is_completed = true
                GROUP BY programme_of_study
                ORDER BY employment_rate DESC
            `);

            // Get employment by sector
            const employmentBySector = await pool.query(`
                SELECT 
                    sector,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE sector IS NOT NULL AND is_completed = true
                GROUP BY sector
                ORDER BY count DESC
            `);

            // Get time to employment distribution
            const timeToEmployment = await pool.query(`
                SELECT 
                    time_to_first_job,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE time_to_first_job IS NOT NULL AND is_completed = true
                GROUP BY time_to_first_job
                ORDER BY 
                    CASE time_to_first_job
                        WHEN 'Less than 3 months' THEN 1
                        WHEN '3–6 months' THEN 2
                        WHEN '6–12 months' THEN 3
                        WHEN 'More than a year' THEN 4
                        WHEN 'Still seeking' THEN 5
                    END
            `);

            // Get job relevance to field
            const jobRelevance = await pool.query(`
                SELECT 
                    job_related_to_field,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE job_related_to_field IS NOT NULL AND is_completed = true
                GROUP BY job_related_to_field
                ORDER BY count DESC
            `);

            // Get income distribution
            const incomeDistribution = await pool.query(`
                SELECT 
                    monthly_income_range,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE monthly_income_range IS NOT NULL 
                AND monthly_income_range != 'Prefer not to say'
                AND is_completed = true
                GROUP BY monthly_income_range
                ORDER BY 
                    CASE monthly_income_range
                        WHEN 'Below GHS 2,000' THEN 1
                        WHEN '2,000–4,999' THEN 2
                        WHEN '5,000–9,999' THEN 3
                        WHEN '10,000 or above' THEN 4
                    END
            `);

            // Get responses by graduation year
            const responsesByYear = await pool.query(`
                SELECT 
                    year_of_graduation,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE is_completed = true
                GROUP BY year_of_graduation
                ORDER BY year_of_graduation DESC
            `);

            // Get main challenges
            const mainChallenges = await pool.query(`
                SELECT 
                    main_challenge,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE main_challenge IS NOT NULL AND is_completed = true
                GROUP BY main_challenge
                ORDER BY count DESC
            `);

            res.status(200).json({
                success: true,
                data: {
                    overview: analyticsResult.rows[0],
                    employment_by_programme: employmentByProgramme.rows,
                    employment_by_sector: employmentBySector.rows,
                    time_to_employment: timeToEmployment.rows,
                    job_relevance: jobRelevance.rows,
                    income_distribution: incomeDistribution.rows,
                    responses_by_year: responsesByYear.rows,
                    main_challenges: mainChallenges.rows
                }
            });

        } catch (error) {
            console.error("Get analytics error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch analytics"
            });
        }
    },

    // Get analytics by programme
    getAnalyticsByProgramme: async (req, res) => {
        try {
            const { programme } = req.params;

            // Get programme-specific statistics
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_responses,
                    COUNT(CASE WHEN current_status = 'Employed' THEN 1 END) as employed_count,
                    COUNT(CASE WHEN current_status = 'Self-employed' THEN 1 END) as self_employed_count,
                    COUNT(CASE WHEN current_status = 'Unemployed' THEN 1 END) as unemployed_count,
                    COUNT(CASE WHEN current_status = 'Pursuing further studies' THEN 1 END) as further_studies_count,
                    ROUND(AVG(skills_relevance_rating), 2) as avg_skills_relevance,
                    ROUND(AVG(job_satisfaction_rating), 2) as avg_job_satisfaction,
                    COUNT(CASE WHEN would_recommend_atu = 'Yes' THEN 1 END) as would_recommend_count
                FROM tracer_study_responses
                WHERE programme_of_study = $1 AND is_completed = true
            `, [programme]);

            // Get employment by sector for this programme
            const sectorDistribution = await pool.query(`
                SELECT 
                    sector,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE programme_of_study = $1 
                AND sector IS NOT NULL 
                AND is_completed = true
                GROUP BY sector
                ORDER BY count DESC
            `, [programme]);

            // Get income distribution for this programme
            const incomeDistribution = await pool.query(`
                SELECT 
                    monthly_income_range,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE programme_of_study = $1
                AND monthly_income_range IS NOT NULL
                AND monthly_income_range != 'Prefer not to say'
                AND is_completed = true
                GROUP BY monthly_income_range
                ORDER BY count DESC
            `, [programme]);

            res.status(200).json({
                success: true,
                programme: programme,
                data: {
                    statistics: stats.rows[0],
                    sector_distribution: sectorDistribution.rows,
                    income_distribution: incomeDistribution.rows
                }
            });

        } catch (error) {
            console.error("Get programme analytics error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch programme analytics"
            });
        }
    },

    // Get analytics by graduation year
    getAnalyticsByYear: async (req, res) => {
        try {
            const { year } = req.params;

            // Get year-specific statistics
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_responses,
                    COUNT(CASE WHEN current_status = 'Employed' THEN 1 END) as employed_count,
                    COUNT(CASE WHEN current_status = 'Self-employed' THEN 1 END) as self_employed_count,
                    COUNT(CASE WHEN current_status = 'Unemployed' THEN 1 END) as unemployed_count,
                    ROUND(AVG(skills_relevance_rating), 2) as avg_skills_relevance,
                    ROUND(AVG(job_satisfaction_rating), 2) as avg_job_satisfaction
                FROM tracer_study_responses
                WHERE year_of_graduation = $1 AND is_completed = true
            `, [year]);

            // Get programme distribution for this year
            const programmeDistribution = await pool.query(`
                SELECT 
                    programme_of_study,
                    COUNT(*) as count
                FROM tracer_study_responses
                WHERE year_of_graduation = $1 AND is_completed = true
                GROUP BY programme_of_study
                ORDER BY count DESC
            `, [year]);

            res.status(200).json({
                success: true,
                year: parseInt(year),
                data: {
                    statistics: stats.rows[0],
                    programme_distribution: programmeDistribution.rows
                }
            });

        } catch (error) {
            console.error("Get year analytics error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch year analytics"
            });
        }
    },

    // Get mentors list (alumni willing to mentor)
    getMentorsList: async (req, res) => {
        try {
            const { programme, sector } = req.query;

            let queryText = `
                SELECT 
                    tsr.id,
                    tsr.full_name,
                    tsr.email,
                    tsr.phone_number,
                    tsr.programme_of_study,
                    tsr.year_of_graduation,
                    tsr.job_title,
                    tsr.employer_name,
                    tsr.sector,
                    tsr.preferred_contact_method,
                    u.profile_picture
                FROM tracer_study_responses tsr
                LEFT JOIN users u ON tsr.user_id = u.id
                WHERE tsr.willing_to_mentor = true 
                AND tsr.is_completed = true
                AND tsr.current_status IN ('Employed', 'Self-employed')
            `;

            const queryParams = [];
            let paramCount = 0;

            if (programme) {
                paramCount++;
                queryText += ` AND tsr.programme_of_study = $${paramCount}`;
                queryParams.push(programme);
            }

            if (sector) {
                paramCount++;
                queryText += ` AND tsr.sector = $${paramCount}`;
                queryParams.push(sector);
            }

            queryText += ` ORDER BY tsr.year_of_graduation DESC`;

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get mentors list error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch mentors list"
            });
        }
    },

    // Export responses to CSV (Admin)
    exportResponses: async (req, res) => {
        try {
            const { programme, year } = req.query;

            let queryText = `
                SELECT 
                    id, full_name, index_number, programme_of_study, year_of_graduation,
                    email, phone_number, current_status, time_to_first_job, main_challenge,
                    job_title, employer_name, sector, job_related_to_field, 
                    monthly_income_range, how_found_job, job_level,
                    skills_relevance_rating, job_satisfaction_rating,
                    programme_quality_rating, internship_support_satisfaction, would_recommend_atu,
                    is_alumni_member, willing_to_mentor, preferred_contact_method, 
                    willing_to_collaborate, submitted_at
                FROM tracer_study_responses
                WHERE is_completed = true
            `;

            const queryParams = [];
            let paramCount = 0;

            if (programme) {
                paramCount++;
                queryText += ` AND programme_of_study = $${paramCount}`;
                queryParams.push(programme);
            }

            if (year) {
                paramCount++;
                queryText += ` AND year_of_graduation = $${paramCount}`;
                queryParams.push(year);
            }

            queryText += ` ORDER BY submitted_at DESC`;

            const result = await pool.query(queryText, queryParams);

            // Convert to CSV format
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "No responses found"
                });
            }

            const headers = Object.keys(result.rows[0]);
            const csvRows = [
                headers.join(','),
                ...result.rows.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        // Escape commas and quotes in values
                        if (value === null) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    }).join(',')
                )
            ];

            const csv = csvRows.join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=tracer_study_responses_${Date.now()}.csv`);
            res.status(200).send(csv);

        } catch (error) {
            console.error("Export responses error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to export responses"
            });
        }
    }
};

export default tracerStudyController;