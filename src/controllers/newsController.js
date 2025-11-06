// src/controllers/newsController.js
import pool from "../config/db.js";

const newsController = {
    // ==================== ARTICLES ====================

    // Get all news articles with filters
getAllArticles: async (req, res) => {
    try {
        const {
            category,
            is_featured,
            tags,
            search,
            page = 1,
            limit = 20,
            sort_by = 'published_at',
            sort_order = 'DESC'
        } = req.query;

        let queryText = `
            SELECT 
                na.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.profile_picture as author_picture
            FROM news_articles na
            LEFT JOIN users u ON na.author_id = u.id
            WHERE na.is_published = true
        `;

        const queryParams = [];
        let paramCount = 0;

        // Filters
        if (category) {
            paramCount++;
            queryText += ` AND na.category = $${paramCount}`;
            queryParams.push(category);
        }

        if (is_featured === 'true') {
            queryText += ` AND na.is_featured = true`;
        }

        if (tags) {
            paramCount++;
            queryText += ` AND na.tags && $${paramCount}::text[]`;
            queryParams.push(`{${tags}}`);
        }

        if (search) {
            paramCount++;
            queryText += ` AND (
                na.title ILIKE $${paramCount} OR 
                na.excerpt ILIKE $${paramCount} OR
                na.content ILIKE $${paramCount}
            )`;
            queryParams.push(`%${search}%`);
        }

        // Get total count (create separate query for count)
        const countQueryText = queryText.replace(
            /SELECT[\s\S]*?FROM/i, 
            'SELECT COUNT(*) FROM'
        );
        const countResult = await pool.query(countQueryText, queryParams);
        const totalArticles = parseInt(countResult.rows[0].count);

        // Add sorting and pagination to main query
        const validSortFields = ['published_at', 'created_at', 'views_count', 'likes_count', 'comments_count', 'title'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'published_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        queryText += ` ORDER BY na.${sortField} ${order}`;

        const offset = (page - 1) * limit;
        paramCount++;
        queryText += ` LIMIT $${paramCount}`;
        queryParams.push(limit);
        
        paramCount++;
        queryText += ` OFFSET $${paramCount}`;
        queryParams.push(offset);

        const result = await pool.query(queryText, queryParams);

        // Add user_has_liked flag if user_id provided
        const userId = req.query.user_id || 0;
        const articlesWithLikeStatus = await Promise.all(
            result.rows.map(async (article) => {
                let userHasLiked = false;
                if (userId && userId !== 0) {
                    const likeCheck = await pool.query(
                        'SELECT id FROM news_likes WHERE news_id = $1 AND user_id = $2',
                        [article.id, userId]
                    );
                    userHasLiked = likeCheck.rows.length > 0;
                }
                return {
                    ...article,
                    user_has_liked: userHasLiked
                };
            })
        );

        res.status(200).json({
            success: true,
            count: articlesWithLikeStatus.length,
            total: totalArticles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(totalArticles / limit)
            },
            data: articlesWithLikeStatus
        });

    } catch (error) {
        console.error("Get articles error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch articles"
        });
    }
},

    // Get featured articles
    getFeaturedArticles: async (req, res) => {
        try {
            const { limit = 5 } = req.query;

            const queryText = `
                SELECT 
                    na.*,
                    u.first_name || ' ' || u.last_name as author_name
                FROM news_articles na
                LEFT JOIN users u ON na.author_id = u.id
                WHERE na.is_published = true AND na.is_featured = true
                ORDER BY na.published_at DESC
                LIMIT $1
            `;

            const result = await pool.query(queryText, [limit]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get featured articles error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch featured articles"
            });
        }
    },

    // Get latest articles
    getLatestArticles: async (req, res) => {
        try {
            const { limit = 10 } = req.query;

            const queryText = `
                SELECT 
                    na.*,
                    u.first_name || ' ' || u.last_name as author_name
                FROM news_articles na
                LEFT JOIN users u ON na.author_id = u.id
                WHERE na.is_published = true
                ORDER BY na.published_at DESC
                LIMIT $1
            `;

            const result = await pool.query(queryText, [limit]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get latest articles error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch latest articles"
            });
        }
    },

    // Get popular articles (most viewed)
    getPopularArticles: async (req, res) => {
        try {
            const { limit = 10 } = req.query;

            const queryText = `
                SELECT 
                    na.*,
                    u.first_name || ' ' || u.last_name as author_name
                FROM news_articles na
                LEFT JOIN users u ON na.author_id = u.id
                WHERE na.is_published = true
                ORDER BY na.views_count DESC, na.likes_count DESC
                LIMIT $1
            `;

            const result = await pool.query(queryText, [limit]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get popular articles error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch popular articles"
            });
        }
    },

    // Get single article
getArticleById: async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.user_id || 0;

        const result = await pool.query(
            `SELECT 
                na.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.email as author_email,
                u.profile_picture as author_picture,
                u.role as author_role
            FROM news_articles na
            LEFT JOIN users u ON na.author_id = u.id
            WHERE na.id = $1 AND na.is_published = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Article not found"
            });
        }

        const article = result.rows[0];

        // Check if user has liked
        let userHasLiked = false;
        if (userId && userId !== 0) {
            const likeCheck = await pool.query(
                'SELECT id FROM news_likes WHERE news_id = $1 AND user_id = $2',
                [id, userId]
            );
            userHasLiked = likeCheck.rows.length > 0;
        }

        // Check if user is subscribed (if you have subscriptions)
        let userIsSubscribed = false;
        // Add subscription check here if needed

        res.status(200).json({
            success: true,
            data: {
                ...article,
                user_has_liked: userHasLiked,
                user_is_subscribed: userIsSubscribed
            }
        });

    } catch (error) {
        console.error("Get article error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch article"
        });
    }
},

// Get article by slug
getArticleBySlug: async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.query.user_id || 0;

        const result = await pool.query(
            `SELECT 
                na.*,
                u.first_name || ' ' || u.last_name as author_name,
                u.email as author_email,
                u.profile_picture as author_picture
            FROM news_articles na
            LEFT JOIN users u ON na.author_id = u.id
            WHERE na.slug = $1 AND na.is_published = true`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Article not found"
            });
        }

        const article = result.rows[0];

        // Check if user has liked
        let userHasLiked = false;
        if (userId && userId !== 0) {
            const likeCheck = await pool.query(
                'SELECT id FROM news_likes WHERE news_id = $1 AND user_id = $2',
                [article.id, userId]
            );
            userHasLiked = likeCheck.rows.length > 0;
        }

        res.status(200).json({
            success: true,
            data: {
                ...article,
                user_has_liked: userHasLiked
            }
        });

    } catch (error) {
        console.error("Get article error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch article"
        });
    }
},



    // Create article (Admin)
    // FIXED createArticle function
// Replace your existing createArticle in newsController.js with this:

createArticle: async (req, res) => {
    try {
        const {
            author_id,
            title,
            slug,
            excerpt,
            content,
            featured_image,
            category,
            tags,
            meta_description,    // ← NOW INCLUDED
            keywords,            // ← NOW INCLUDED
            is_featured,
            is_published
        } = req.body;

        // Required fields validation
        if (!author_id || !title || !slug || !excerpt || !content || !category) {
            return res.status(400).json({
                success: false,
                error: "Author ID, title, slug, excerpt, content, and category are required"
            });
        }

        // Length validations
        if (title.length > 255) {
            return res.status(400).json({
                success: false,
                error: "Title must be less than 255 characters"
            });
        }

        if (slug.length > 255) {
            return res.status(400).json({
                success: false,
                error: "Slug must be less than 255 characters"
            });
        }

        if (excerpt.length < 10) {
            return res.status(400).json({
                success: false,
                error: "Excerpt must be at least 10 characters"
            });
        }

        if (excerpt.length > 1000) {
            return res.status(400).json({
                success: false,
                error: "Excerpt must be less than 1000 characters"
            });
        }

        if (content.length < 50) {
            return res.status(400).json({
                success: false,
                error: "Content must be at least 50 characters"
            });
        }

        if (meta_description && meta_description.length > 160) {
            return res.status(400).json({
                success: false,
                error: "Meta description must be less than 160 characters"
            });
        }

        if (keywords && keywords.length > 255) {
            return res.status(400).json({
                success: false,
                error: "Keywords must be less than 255 characters"
            });
        }

        // Validate featured_image size (if base64)
        if (featured_image && featured_image.startsWith('data:image')) {
            // Base64 image - warn if too large
            if (featured_image.length > 100000) {
                console.warn('Warning: Featured image is very large (base64). Consider using file upload.');
                // Don't reject, but log warning
            }
        }

        // Validate category
        const validCategories = ['Academic', 'Career', 'Social', 'Alumni', 'University', 'General'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: `Category must be one of: ${validCategories.join(', ')}`
            });
        }

        // Check if slug already exists
        const slugCheck = await pool.query(
            "SELECT id FROM news_articles WHERE slug = $1",
            [slug]
        );

        if (slugCheck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: "Article with this slug already exists. Please use a different title."
            });
        }

        // Insert article with ALL fields
        const result = await pool.query(
            `INSERT INTO news_articles (
                author_id, title, slug, excerpt, content, featured_image,
                category, tags, meta_description, keywords,
                is_featured, is_published
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                author_id,
                title,
                slug,
                excerpt,
                content,
                featured_image || null,
                category,
                tags || null,
                meta_description || null,
                keywords || null,
                is_featured || false,
                is_published !== undefined ? is_published : true
            ]
        );

        res.status(201).json({
            success: true,
            message: "Article created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Create article error:", error);
        
        // Handle specific error codes
        if (error.code === '22001') {
            // String data right truncation
            return res.status(400).json({
                success: false,
                error: "One or more fields exceed the maximum allowed length. Please shorten your content."
            });
        }
        
        if (error.code === '23505') {
            // Unique violation
            return res.status(409).json({
                success: false,
                error: "An article with this slug already exists"
            });
        }

        if (error.code === '23503') {
            // Foreign key violation
            return res.status(400).json({
                success: false,
                error: "Invalid author ID"
            });
        }
        
        res.status(500).json({
            success: false,
            error: "Failed to create article. Please try again."
        });
    }
},

    // Update article (Admin)
    updateArticle: async (req, res) => {
        try {
            const { id } = req.params;

            const allowedFields = [
                'title', 'slug', 'excerpt', 'content', 'featured_image',
                'category', 'tags', 'is_featured', 'is_published'
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
                UPDATE news_articles 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(queryText, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Article not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Article updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update article error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update article"
            });
        }
    },

    // Delete article (Admin)
    deleteArticle: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "DELETE FROM news_articles WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Article not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Article deleted successfully"
            });

        } catch (error) {
            console.error("Delete article error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete article"
            });
        }
    },

    // Increment view count
    incrementViewCount: async (req, res) => {
        try {
            const { id } = req.params;

            await pool.query(
                "UPDATE news_articles SET views_count = views_count + 1 WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "View count updated"
            });

        } catch (error) {
            console.error("Increment views error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update view count"
            });
        }
    },

    // Like article
    likeArticle: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if already liked
            const existingLike = await pool.query(
                "SELECT id FROM news_likes WHERE news_id = $1 AND user_id = $2",
                [id, user_id]
            );

            if (existingLike.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Article already liked"
                });
            }

            await pool.query(
                "INSERT INTO news_likes (news_id, user_id) VALUES ($1, $2)",
                [id, user_id]
            );

            // Get updated likes count
            const articleResult = await pool.query(
                "SELECT likes_count FROM news_articles WHERE id = $1",
                [id]
            );

            res.status(201).json({
                success: true,
                message: "Article liked successfully",
                data: {
                    likes_count: articleResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Like article error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to like article"
            });
        }
    },

    // Unlike article
    unlikeArticle: async (req, res) => {
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
                "DELETE FROM news_likes WHERE news_id = $1 AND user_id = $2 RETURNING *",
                [id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Like not found"
                });
            }

            // Get updated likes count
            const articleResult = await pool.query(
                "SELECT likes_count FROM news_articles WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "Article unliked successfully",
                data: {
                    likes_count: articleResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Unlike article error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unlike article"
            });
        }
    },

    // Publish article (Admin)
    publishArticle: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "UPDATE news_articles SET is_published = true WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Article not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Article published successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Publish article error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to publish article"
            });
        }
    },

    // Unpublish article (Admin)
    unpublishArticle: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "UPDATE news_articles SET is_published = false WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Article not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Article unpublished successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Unpublish article error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unpublish article"
            });
        }
    },

    // ==================== COMMENTS ====================

    // Get article comments
    getArticleComments: async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const queryText = `
                SELECT 
                    nc.*,
                    u.first_name || ' ' || u.last_name as author_name,
                    u.profile_picture as author_picture,
                    (SELECT COUNT(*) > 0 FROM news_comment_likes WHERE comment_id = nc.id AND user_id = $3) as user_has_liked
                FROM news_comments nc
                LEFT JOIN users u ON nc.user_id = u.id
                WHERE nc.news_id = $1
                AND nc.is_deleted = false
                ORDER BY nc.created_at DESC
                LIMIT $2 OFFSET $4
            `;

            const offset = (page - 1) * limit;
            const result = await pool.query(queryText, [id, limit, req.query.user_id || 0, offset]);

            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM news_comments 
                 WHERE news_id = $1 AND is_deleted = false`,
                [id]
            );

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: parseInt(countResult.rows[0].count),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get comments error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch comments"
            });
        }
    },

    // Add comment
    addComment: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, comment } = req.body;

            if (!user_id || !comment) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and comment are required"
                });
            }

            if (comment.length < 1 || comment.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: "Comment must be between 1 and 2000 characters"
                });
            }

            // Check if article exists
            const articleCheck = await pool.query(
                "SELECT id FROM news_articles WHERE id = $1 AND is_published = true",
                [id]
            );

            if (articleCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Article not found"
                });
            }

            const result = await pool.query(
                `INSERT INTO news_comments (news_id, user_id, comment)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [id, user_id, comment]
            );

            // Get user info
            const userInfo = await pool.query(
                "SELECT first_name, last_name, profile_picture FROM users WHERE id = $1",
                [user_id]
            );

            const commentData = {
                ...result.rows[0],
                ...userInfo.rows[0],
                user_has_liked: false
            };

            res.status(201).json({
                success: true,
                message: "Comment added successfully",
                data: commentData
            });

        } catch (error) {
            console.error("Add comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to add comment"
            });
        }
    },

    // Update comment
    updateComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id, comment } = req.body;

            if (!user_id || !comment) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and comment are required"
                });
            }

            const result = await pool.query(
                `UPDATE news_comments 
                 SET comment = $1
                 WHERE id = $2 AND news_id = $3 AND user_id = $4
                 RETURNING *`,
                [comment, commentId, id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Comment not found or you don't have permission to edit"
                });
            }

            res.status(200).json({
                success: true,
                message: "Comment updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update comment"
            });
        }
    },

    // Delete comment (soft delete)
    deleteComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                `UPDATE news_comments 
                 SET is_deleted = true, comment = '[Comment deleted]'
                 WHERE id = $1 AND news_id = $2 AND user_id = $3
                 RETURNING *`,
                [commentId, id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Comment not found or you don't have permission to delete"
                });
            }

            res.status(200).json({
                success: true,
                message: "Comment deleted successfully"
            });

        } catch (error) {
            console.error("Delete comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete comment"
            });
        }
    },

    // Like comment
    likeComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if already liked
            const existingLike = await pool.query(
                "SELECT id FROM news_comment_likes WHERE comment_id = $1 AND user_id = $2",
                [commentId, user_id]
            );

            if (existingLike.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Comment already liked"
                });
            }

            await pool.query(
                "INSERT INTO news_comment_likes (comment_id, user_id) VALUES ($1, $2)",
                [commentId, user_id]
            );

            // Get updated likes count
            const commentResult = await pool.query(
                "SELECT likes_count FROM news_comments WHERE id = $1",
                [commentId]
            );

            res.status(201).json({
                success: true,
                message: "Comment liked successfully",
                data: {
                    likes_count: commentResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Like comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to like comment"
            });
        }
    },

    // Unlike comment
    unlikeComment: async (req, res) => {
        try {
            const { id, commentId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "DELETE FROM news_comment_likes WHERE comment_id = $1 AND user_id = $2 RETURNING *",
                [commentId, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Like not found"
                });
            }

            // Get updated likes count
            const commentResult = await pool.query(
                "SELECT likes_count FROM news_comments WHERE id = $1",
                [commentId]
            );

            res.status(200).json({
                success: true,
                message: "Comment unliked successfully",
                data: {
                    likes_count: commentResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Unlike comment error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unlike comment"
            });
        }
    },

    // ==================== STATISTICS ====================

    // Get news statistics
    getNewsStats: async (req, res) => {
        try {
            // Total articles
            const totalArticlesResult = await pool.query(
                "SELECT COUNT(*) as total FROM news_articles WHERE is_published = true"
            );

            // Total comments
            const totalCommentsResult = await pool.query(
                "SELECT COUNT(*) as total FROM news_comments WHERE is_deleted = false"
            );

            // Articles by category
            const articlesByCategoryResult = await pool.query(
                `SELECT 
                    category,
                    COUNT(*) as article_count
                 FROM news_articles
                 WHERE is_published = true
                 GROUP BY category
                 ORDER BY article_count DESC`
            );

            // Most viewed articles
            const mostViewedResult = await pool.query(
                `SELECT 
                    id,
                    title,
                    category,
                    views_count,
                    likes_count,
                    comments_count
                 FROM news_articles
                 WHERE is_published = true
                 ORDER BY views_count DESC
                 LIMIT 10`
            );

            // Most liked articles
            const mostLikedResult = await pool.query(
                `SELECT 
                    id,
                    title,
                    category,
                    views_count,
                    likes_count,
                    comments_count
                 FROM news_articles
                 WHERE is_published = true
                 ORDER BY likes_count DESC
                 LIMIT 10`
            );

            // Recent activity (last 30 days)
            const recentActivityResult = await pool.query(
                `SELECT 
                    COUNT(*) as new_articles
                 FROM news_articles
                 WHERE is_published = true
                 AND published_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'`
            );

            res.status(200).json({
                success: true,
                data: {
                    total_articles: parseInt(totalArticlesResult.rows[0].total),
                    total_comments: parseInt(totalCommentsResult.rows[0].total),
                    new_articles_last_month: parseInt(recentActivityResult.rows[0].new_articles),
                    articles_by_category: articlesByCategoryResult.rows,
                    most_viewed_articles: mostViewedResult.rows,
                    most_liked_articles: mostLikedResult.rows
                }
            });

        } catch (error) {
            console.error("Get news stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch news statistics"
            });
        }
    }
};


const checkCommentOwnership = async (commentId, userId, isAdmin) => {
    const result = await pool.query(
        "SELECT user_id FROM news_comments WHERE id = $1",
        [commentId]
    );
    
    if (result.rows.length === 0) {
        return { exists: false, isOwner: false };
    }
    
    const isOwner = result.rows[0].user_id === parseInt(userId);
    return { 
        exists: true, 
        isOwner: isOwner || isAdmin 
    };
}

export default newsController;