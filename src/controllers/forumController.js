// src/controllers/forumController.js
import pool from "../config/db.js";

const forumController = {
    // ==================== CATEGORIES ====================

    // Get all categories
    getAllCategories: async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT * FROM forum_categories 
                 WHERE is_active = true 
                 ORDER BY order_position ASC, name ASC`
            );

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get categories error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch categories"
            });
        }
    },

    // Get single category
    getCategoryById: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "SELECT * FROM forum_categories WHERE id = $1 AND is_active = true",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get category error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch category"
            });
        }
    },

    // Create category (Admin)
    createCategory: async (req, res) => {
        try {
            const { name, slug, description, icon, color, order_position } = req.body;

            if (!name || !slug || !description) {
                return res.status(400).json({
                    success: false,
                    error: "Name, slug, and description are required"
                });
            }

            // Check if slug already exists
            const slugCheck = await pool.query(
                "SELECT id FROM forum_categories WHERE slug = $1",
                [slug]
            );

            if (slugCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Category with this slug already exists"
                });
            }

            const result = await pool.query(
                `INSERT INTO forum_categories (name, slug, description, icon, color, order_position)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [name, slug, description, icon || null, color || null, order_position || 0]
            );

            res.status(201).json({
                success: true,
                message: "Category created successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Create category error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create category"
            });
        }
    },

    // Update category (Admin)
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const allowedFields = ['name', 'slug', 'description', 'icon', 'color', 'order_position', 'is_active'];

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
                UPDATE forum_categories 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(queryText, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Category updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update category error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update category"
            });
        }
    },

    // Delete category (Admin)
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;

            // Check if category has posts
            const postsCheck = await pool.query(
                "SELECT COUNT(*) FROM forum_posts WHERE category_id = $1",
                [id]
            );

            if (parseInt(postsCheck.rows[0].count) > 0) {
                return res.status(400).json({
                    success: false,
                    error: "Cannot delete category with existing posts"
                });
            }

            const result = await pool.query(
                "DELETE FROM forum_categories WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Category deleted successfully"
            });

        } catch (error) {
            console.error("Delete category error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete category"
            });
        }
    },

    // ==================== POSTS ====================

    // Get all posts with filters
    getAllPosts: async (req, res) => {
        try {
            const {
                category_id,
                user_id,
                tags,
                is_pinned,
                search,
                page = 1,
                limit = 20,
                sort_by = 'last_activity_at',
                sort_order = 'DESC'
            } = req.query;

            let queryText = `
                SELECT 
                    fp.*,
                    fc.name as category_name,
                    fc.slug as category_slug,
                    u.first_name || ' ' || u.last_name as author_name,
                    u.profile_picture as author_picture,
                    (SELECT COUNT(*) > 0 FROM forum_post_likes WHERE post_id = fp.id AND user_id = $1) as user_has_liked
                FROM forum_posts fp
                LEFT JOIN forum_categories fc ON fp.category_id = fc.id
                LEFT JOIN users u ON fp.user_id = u.id
                WHERE fp.is_published = true
            `;

            const queryParams = [req.query.current_user_id || 0];
            let paramCount = 1;

            // Filters
            if (category_id) {
                paramCount++;
                queryText += ` AND fp.category_id = $${paramCount}`;
                queryParams.push(category_id);
            }

            if (user_id) {
                paramCount++;
                queryText += ` AND fp.user_id = $${paramCount}`;
                queryParams.push(user_id);
            }

            if (is_pinned === 'true') {
                queryText += ` AND fp.is_pinned = true`;
            }

            if (tags) {
                paramCount++;
                queryText += ` AND fp.tags && $${paramCount}::text[]`;
                queryParams.push(`{${tags}}`);
            }

            if (search) {
                paramCount++;
                queryText += ` AND (
                    fp.title ILIKE $${paramCount} OR 
                    fp.content ILIKE $${paramCount}
                )`;
                queryParams.push(`%${search}%`);
            }

            // Get total count
            const countQuery = queryText.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) FROM');
            const countResult = await pool.query(countQuery, queryParams);
            const totalPosts = parseInt(countResult.rows[0].count);

            // Add sorting and pagination
            const validSortFields = ['created_at', 'last_activity_at', 'views_count', 'replies_count', 'likes_count', 'title'];
            const sortField = validSortFields.includes(sort_by) ? sort_by : 'last_activity_at';
            const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Pinned posts first, then sort by selected field
            queryText += ` ORDER BY fp.is_pinned DESC, fp.${sortField} ${order}`;

            const offset = (page - 1) * limit;
            queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await pool.query(queryText, queryParams);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                total: totalPosts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_pages: Math.ceil(totalPosts / limit)
                },
                data: result.rows
            });

        } catch (error) {
            console.error("Get posts error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch posts"
            });
        }
    },

    // Get popular posts
    getPopularPosts: async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;

            const queryText = `
                SELECT 
                    fp.*,
                    fc.name as category_name,
                    u.first_name || ' ' || u.last_name as author_name
                FROM forum_posts fp
                LEFT JOIN forum_categories fc ON fp.category_id = fc.id
                LEFT JOIN users u ON fp.user_id = u.id
                WHERE fp.is_published = true
                ORDER BY fp.likes_count DESC, fp.views_count DESC
                LIMIT $1 OFFSET $2
            `;

            const offset = (page - 1) * limit;
            const result = await pool.query(queryText, [limit, offset]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get popular posts error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch popular posts"
            });
        }
    },

    // Get trending posts (most activity in last 7 days)
    getTrendingPosts: async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;

            const queryText = `
                SELECT 
                    fp.*,
                    fc.name as category_name,
                    u.first_name || ' ' || u.last_name as author_name
                FROM forum_posts fp
                LEFT JOIN forum_categories fc ON fp.category_id = fc.id
                LEFT JOIN users u ON fp.user_id = u.id
                WHERE fp.is_published = true
                AND fp.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
                ORDER BY (fp.replies_count + fp.likes_count + fp.views_count) DESC
                LIMIT $1 OFFSET $2
            `;

            const offset = (page - 1) * limit;
            const result = await pool.query(queryText, [limit, offset]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get trending posts error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch trending posts"
            });
        }
    },

    // Get my posts
    getMyPosts: async (req, res) => {
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
                    fp.*,
                    fc.name as category_name
                FROM forum_posts fp
                LEFT JOIN forum_categories fc ON fp.category_id = fc.id
                WHERE fp.user_id = $1 AND fp.is_published = true
                ORDER BY fp.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const offset = (page - 1) * limit;
            const result = await pool.query(queryText, [user_id, limit, offset]);

            // Get total count
            const countResult = await pool.query(
                "SELECT COUNT(*) FROM forum_posts WHERE user_id = $1 AND is_published = true",
                [user_id]
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
            console.error("Get my posts error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch posts"
            });
        }
    },

    // Get single post
    getPostById: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `SELECT 
                    fp.*,
                    fc.name as category_name,
                    fc.slug as category_slug,
                    u.first_name || ' ' || u.last_name as author_name,
                    u.email as author_email,
                    u.profile_picture as author_picture,
                    u.graduation_year as author_graduation_year,
                    (SELECT COUNT(*) > 0 FROM forum_post_likes WHERE post_id = fp.id AND user_id = $2) as user_has_liked,
                    (SELECT COUNT(*) > 0 FROM forum_subscriptions WHERE post_id = fp.id AND user_id = $2) as user_is_subscribed
                FROM forum_posts fp
                LEFT JOIN forum_categories fc ON fp.category_id = fc.id
                LEFT JOIN users u ON fp.user_id = u.id
                WHERE fp.id = $1 AND fp.is_published = true`,
                [id, req.query.user_id || 0]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            res.status(200).json({
                success: true,
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Get post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch post"
            });
        }
    },

    // Create post
    createPost: async (req, res) => {
        try {
            const { category_id, user_id, title, content, slug, tags } = req.body;

            if (!category_id || !user_id || !title || !content || !slug) {
                return res.status(400).json({
                    success: false,
                    error: "Category ID, user ID, title, content, and slug are required"
                });
            }

            // Validate title and content length
            if (title.length < 5 || title.length > 255) {
                return res.status(400).json({
                    success: false,
                    error: "Title must be between 5 and 255 characters"
                });
            }

            if (content.length < 10) {
                return res.status(400).json({
                    success: false,
                    error: "Content must be at least 10 characters"
                });
            }

            // Check if slug already exists
            const slugCheck = await pool.query(
                "SELECT id FROM forum_posts WHERE slug = $1",
                [slug]
            );

            if (slugCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Post with this slug already exists"
                });
            }

            // Check if category exists
            const categoryCheck = await pool.query(
                "SELECT id FROM forum_categories WHERE id = $1 AND is_active = true",
                [category_id]
            );

            if (categoryCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found"
                });
            }

            const result = await pool.query(
                `INSERT INTO forum_posts (category_id, user_id, title, content, slug, tags)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [category_id, user_id, title, content, slug, tags || null]
            );

            res.status(201).json({
                success: true,
                message: "Post created successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Create post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create post"
            });
        }
    },

    // Update post
    updatePost: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            // Check if post exists and user owns it
            const postCheck = await pool.query(
                "SELECT user_id FROM forum_posts WHERE id = $1",
                [id]
            );

            if (postCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            if (postCheck.rows[0].user_id !== user_id) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have permission to edit this post"
                });
            }

            const allowedFields = ['title', 'content', 'tags'];
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
                UPDATE forum_posts 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(queryText, values);

            res.status(200).json({
                success: true,
                message: "Post updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update post"
            });
        }
    },

    // Delete post
    deletePost: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if post exists and user owns it
            const postCheck = await pool.query(
                "SELECT user_id FROM forum_posts WHERE id = $1",
                [id]
            );

            if (postCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            if (postCheck.rows[0].user_id !== parseInt(user_id)) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have permission to delete this post"
                });
            }

            await pool.query(
                "UPDATE forum_posts SET is_published = false WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "Post deleted successfully"
            });

        } catch (error) {
            console.error("Delete post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete post"
            });
        }
    },

    // Increment view count
    incrementPostViews: async (req, res) => {
        try {
            const { id } = req.params;

            await pool.query(
                "UPDATE forum_posts SET views_count = views_count + 1 WHERE id = $1",
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

    // Like post
    likePost: async (req, res) => {
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
                "SELECT id FROM forum_post_likes WHERE post_id = $1 AND user_id = $2",
                [id, user_id]
            );

            if (existingLike.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Post already liked"
                });
            }

            await pool.query(
                "INSERT INTO forum_post_likes (post_id, user_id) VALUES ($1, $2)",
                [id, user_id]
            );

            // Get updated likes count
            const postResult = await pool.query(
                "SELECT likes_count FROM forum_posts WHERE id = $1",
                [id]
            );

            res.status(201).json({
                success: true,
                message: "Post liked successfully",
                data: {
                    likes_count: postResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Like post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to like post"
            });
        }
    },

    // Unlike post
    unlikePost: async (req, res) => {
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
                "DELETE FROM forum_post_likes WHERE post_id = $1 AND user_id = $2 RETURNING *",
                [id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Like not found"
                });
            }

            // Get updated likes count
            const postResult = await pool.query(
                "SELECT likes_count FROM forum_posts WHERE id = $1",
                [id]
            );

            res.status(200).json({
                success: true,
                message: "Post unliked successfully",
                data: {
                    likes_count: postResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Unlike post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unlike post"
            });
        }
    },

    // Pin post (Admin)
    pinPost: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "UPDATE forum_posts SET is_pinned = true WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Post pinned successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Pin post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to pin post"
            });
        }
    },

    // Unpin post (Admin)
    unpinPost: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "UPDATE forum_posts SET is_pinned = false WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Post unpinned successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Unpin post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unpin post"
            });
        }
    },

    // Lock post (Admin)
    lockPost: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "UPDATE forum_posts SET is_locked = true WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Post locked successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Lock post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to lock post"
            });
        }
    },

    // Unlock post (Admin)
    unlockPost: async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                "UPDATE forum_posts SET is_locked = false WHERE id = $1 RETURNING *",
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Post unlocked successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Unlock post error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unlock post"
            });
        }
    },

    // Subscribe to post
    subscribeToPost: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if already subscribed
            const existingSub = await pool.query(
                "SELECT id FROM forum_subscriptions WHERE post_id = $1 AND user_id = $2",
                [id, user_id]
            );

            if (existingSub.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Already subscribed to this post"
                });
            }

            await pool.query(
                "INSERT INTO forum_subscriptions (post_id, user_id) VALUES ($1, $2)",
                [id, user_id]
            );

            res.status(201).json({
                success: true,
                message: "Subscribed to post successfully"
            });

        } catch (error) {
            console.error("Subscribe error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to subscribe to post"
            });
        }
    },

    // Unsubscribe from post
    unsubscribeFromPost: async (req, res) => {
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
                "DELETE FROM forum_subscriptions WHERE post_id = $1 AND user_id = $2 RETURNING *",
                [id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Subscription not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Unsubscribed from post successfully"
            });

        } catch (error) {
            console.error("Unsubscribe error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unsubscribe from post"
            });
        }
    },

    // ==================== REPLIES ====================

    // Get post replies
    getPostReplies: async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const queryText = `
                SELECT 
                    fr.*,
                    u.first_name || ' ' || u.last_name as author_name,
                    u.profile_picture as author_picture,
                    u.graduation_year as author_graduation_year,
                    (SELECT COUNT(*) FROM forum_replies WHERE parent_reply_id = fr.id AND is_deleted = false) as replies_count,
                    (SELECT COUNT(*) > 0 FROM forum_reply_likes WHERE reply_id = fr.id AND user_id = $3) as user_has_liked
                FROM forum_replies fr
                LEFT JOIN users u ON fr.user_id = u.id
                WHERE fr.post_id = $1
                AND fr.parent_reply_id IS NULL
                AND fr.is_deleted = false
                ORDER BY fr.is_solution DESC, fr.created_at ASC
                LIMIT $2 OFFSET $4
            `;

            const offset = (page - 1) * limit;
            const result = await pool.query(queryText, [id, limit, req.query.user_id || 0, offset]);

            // Get total count
            const countResult = await pool.query(
                `SELECT COUNT(*) FROM forum_replies 
                 WHERE post_id = $1 AND parent_reply_id IS NULL AND is_deleted = false`,
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
            console.error("Get replies error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch replies"
            });
        }
    },

    // Get nested replies (replies to a reply)
    getNestedReplies: async (req, res) => {
        try {
            const { id, replyId } = req.params;

            const queryText = `
                SELECT 
                    fr.*,
                    u.first_name || ' ' || u.last_name as author_name,
                    u.profile_picture as author_picture,
                    (SELECT COUNT(*) > 0 FROM forum_reply_likes WHERE reply_id = fr.id AND user_id = $3) as user_has_liked
                FROM forum_replies fr
                LEFT JOIN users u ON fr.user_id = u.id
                WHERE fr.parent_reply_id = $1
                AND fr.post_id = $2
                AND fr.is_deleted = false
                ORDER BY fr.created_at ASC
            `;

            const result = await pool.query(queryText, [replyId, id, req.query.user_id || 0]);

            res.status(200).json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });

        } catch (error) {
            console.error("Get nested replies error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch nested replies"
            });
        }
    },

    // Add reply to post
    addReply: async (req, res) => {
        try {
            const { id } = req.params;
            const { user_id, content } = req.body;

            if (!user_id || !content) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and content are required"
                });
            }

            if (content.length < 1 || content.length > 10000) {
                return res.status(400).json({
                    success: false,
                    error: "Content must be between 1 and 10000 characters"
                });
            }

            // Check if post exists and is not locked
            const postCheck = await pool.query(
                "SELECT is_locked FROM forum_posts WHERE id = $1 AND is_published = true",
                [id]
            );

            if (postCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            if (postCheck.rows[0].is_locked) {
                return res.status(403).json({
                    success: false,
                    error: "This post is locked and cannot receive new replies"
                });
            }

            const result = await pool.query(
                `INSERT INTO forum_replies (post_id, user_id, content)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [id, user_id, content]
            );

            // Get user info
            const userInfo = await pool.query(
                "SELECT first_name, last_name, profile_picture FROM users WHERE id = $1",
                [user_id]
            );

            const replyData = {
                ...result.rows[0],
                ...userInfo.rows[0],
                replies_count: 0,
                user_has_liked: false
            };

            res.status(201).json({
                success: true,
                message: "Reply added successfully",
                data: replyData
            });

        } catch (error) {
            console.error("Add reply error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to add reply"
            });
        }
    },

    // Reply to a reply (nested reply)
    replyToReply: async (req, res) => {
        try {
            const { id, replyId } = req.params;
            const { user_id, content } = req.body;

            if (!user_id || !content) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and content are required"
                });
            }

            // Check if parent reply exists
            const replyCheck = await pool.query(
                "SELECT id FROM forum_replies WHERE id = $1 AND post_id = $2",
                [replyId, id]
            );

            if (replyCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Parent reply not found"
                });
            }

            // Check if post is locked
            const postCheck = await pool.query(
                "SELECT is_locked FROM forum_posts WHERE id = $1",
                [id]
            );

            if (postCheck.rows[0].is_locked) {
                return res.status(403).json({
                    success: false,
                    error: "This post is locked"
                });
            }

            const result = await pool.query(
                `INSERT INTO forum_replies (post_id, user_id, parent_reply_id, content)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [id, user_id, replyId, content]
            );

            // Get user info
            const userInfo = await pool.query(
                "SELECT first_name, last_name, profile_picture FROM users WHERE id = $1",
                [user_id]
            );

            const replyData = {
                ...result.rows[0],
                ...userInfo.rows[0],
                user_has_liked: false
            };

            res.status(201).json({
                success: true,
                message: "Reply added successfully",
                data: replyData
            });

        } catch (error) {
            console.error("Reply to reply error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to add reply"
            });
        }
    },

    // Update reply
    updateReply: async (req, res) => {
        try {
            const { id, replyId } = req.params;
            const { user_id, content } = req.body;

            if (!user_id || !content) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and content are required"
                });
            }

            const result = await pool.query(
                `UPDATE forum_replies 
                 SET content = $1
                 WHERE id = $2 AND post_id = $3 AND user_id = $4
                 RETURNING *`,
                [content, replyId, id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Reply not found or you don't have permission to edit"
                });
            }

            res.status(200).json({
                success: true,
                message: "Reply updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update reply error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update reply"
            });
        }
    },

    // Delete reply (soft delete)
    deleteReply: async (req, res) => {
        try {
            const { id, replyId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                `UPDATE forum_replies 
                 SET is_deleted = true, content = '[Reply deleted]'
                 WHERE id = $1 AND post_id = $2 AND user_id = $3
                 RETURNING *`,
                [replyId, id, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Reply not found or you don't have permission to delete"
                });
            }

            res.status(200).json({
                success: true,
                message: "Reply deleted successfully"
            });

        } catch (error) {
            console.error("Delete reply error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete reply"
            });
        }
    },

    // Like reply
    likeReply: async (req, res) => {
        try {
            const { id, replyId } = req.params;
            const { user_id } = req.body;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            // Check if already liked
            const existingLike = await pool.query(
                "SELECT id FROM forum_reply_likes WHERE reply_id = $1 AND user_id = $2",
                [replyId, user_id]
            );

            if (existingLike.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: "Reply already liked"
                });
            }

            await pool.query(
                "INSERT INTO forum_reply_likes (reply_id, user_id) VALUES ($1, $2)",
                [replyId, user_id]
            );

            // Get updated likes count
            const replyResult = await pool.query(
                "SELECT likes_count FROM forum_replies WHERE id = $1",
                [replyId]
            );

            res.status(201).json({
                success: true,
                message: "Reply liked successfully",
                data: {
                    likes_count: replyResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Like reply error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to like reply"
            });
        }
    },

    // Unlike reply
    unlikeReply: async (req, res) => {
        try {
            const { id, replyId } = req.params;
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const result = await pool.query(
                "DELETE FROM forum_reply_likes WHERE reply_id = $1 AND user_id = $2 RETURNING *",
                [replyId, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Like not found"
                });
            }

            // Get updated likes count
            const replyResult = await pool.query(
                "SELECT likes_count FROM forum_replies WHERE id = $1",
                [replyId]
            );

            res.status(200).json({
                success: true,
                message: "Reply unliked successfully",
                data: {
                    likes_count: replyResult.rows[0].likes_count
                }
            });

        } catch (error) {
            console.error("Unlike reply error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to unlike reply"
            });
        }
    },

    // Mark reply as solution
    markAsSolution: async (req, res) => {
        try {
            const { id, replyId } = req.params;
            const { user_id } = req.body;

            // Check if user is post author
            const postCheck = await pool.query(
                "SELECT user_id FROM forum_posts WHERE id = $1",
                [id]
            );

            if (postCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Post not found"
                });
            }

            if (postCheck.rows[0].user_id !== user_id) {
                return res.status(403).json({
                    success: false,
                    error: "Only the post author can mark a solution"
                });
            }

            // Unmark any existing solution
            await pool.query(
                "UPDATE forum_replies SET is_solution = false WHERE post_id = $1",
                [id]
            );

            // Mark new solution
            const result = await pool.query(
                "UPDATE forum_replies SET is_solution = true WHERE id = $1 AND post_id = $2 RETURNING *",
                [replyId, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Reply not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Reply marked as solution",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Mark solution error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to mark reply as solution"
            });
        }
    },

    // ==================== STATISTICS ====================

    // Get forum statistics
    getForumStats: async (req, res) => {
        try {
            // Total posts
            const totalPostsResult = await pool.query(
                "SELECT COUNT(*) as total FROM forum_posts WHERE is_published = true"
            );

            // Total replies
            const totalRepliesResult = await pool.query(
                "SELECT COUNT(*) as total FROM forum_replies WHERE is_deleted = false"
            );

            // Total categories
            const totalCategoriesResult = await pool.query(
                "SELECT COUNT(*) as total FROM forum_categories WHERE is_active = true"
            );

            // Posts by category
            const postsByCategoryResult = await pool.query(
                `SELECT 
                    fc.name as category_name,
                    COUNT(fp.id) as post_count
                 FROM forum_categories fc
                 LEFT JOIN forum_posts fp ON fc.id = fp.category_id AND fp.is_published = true
                 WHERE fc.is_active = true
                 GROUP BY fc.name
                 ORDER BY post_count DESC`
            );

            // Most active users (by posts)
            const activeUsersResult = await pool.query(
                `SELECT 
                    u.first_name || ' ' || u.last_name as user_name,
                    COUNT(fp.id) as post_count
                 FROM users u
                 JOIN forum_posts fp ON u.id = fp.user_id
                 WHERE fp.is_published = true
                 GROUP BY u.id, user_name
                 ORDER BY post_count DESC
                 LIMIT 10`
            );

            // Most popular posts
            const popularPostsResult = await pool.query(
                `SELECT 
                    id,
                    title,
                    views_count,
                    replies_count,
                    likes_count
                 FROM forum_posts
                 WHERE is_published = true
                 ORDER BY (views_count + replies_count + likes_count) DESC
                 LIMIT 10`
            );

            // Recent activity (last 7 days)
            const recentActivityResult = await pool.query(
                `SELECT 
                    COUNT(*) as new_posts
                 FROM forum_posts
                 WHERE is_published = true
                 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`
            );

            res.status(200).json({
                success: true,
                data: {
                    total_posts: parseInt(totalPostsResult.rows[0].total),
                    total_replies: parseInt(totalRepliesResult.rows[0].total),
                    total_categories: parseInt(totalCategoriesResult.rows[0].total),
                    new_posts_last_week: parseInt(recentActivityResult.rows[0].new_posts),
                    posts_by_category: postsByCategoryResult.rows,
                    most_active_users: activeUsersResult.rows,
                    most_popular_posts: popularPostsResult.rows
                }
            });

        } catch (error) {
            console.error("Get forum stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch forum statistics"
            });
        }
    }
};



// Helper function to check post ownership
const checkPostOwnership = async (postId, userId, isAdmin) => {
    const result = await pool.query(
        "SELECT user_id FROM forum_posts WHERE id = $1",
        [postId]
    );
    
    if (result.rows.length === 0) {
        return { exists: false, isOwner: false };
    }
    
    const isOwner = result.rows[0].user_id === parseInt(userId);
    return { 
        exists: true, 
        isOwner: isOwner || isAdmin 
    };
};

// Helper function to check reply ownership
const checkReplyOwnership = async (replyId, userId, isAdmin) => {
    const result = await pool.query(
        "SELECT user_id FROM forum_replies WHERE id = $1",
        [replyId]
    );
    
    if (result.rows.length === 0) {
        return { exists: false, isOwner: false };
    }
    
    const isOwner = result.rows[0].user_id === parseInt(userId);
    return { 
        exists: true, 
        isOwner: isOwner || isAdmin 
    };
};



export default forumController;