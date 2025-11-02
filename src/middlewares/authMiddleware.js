// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Verify JWT token
export const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: "No token provided. Authorization required."
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists and is active
        const userResult = await pool.query(
            "SELECT id, email, role, is_active, is_verified FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: "User not found. Invalid token."
            });
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                error: "Account is deactivated. Please contact support."
            });
        }

        // Attach user info to request
        // ✅ Set both id and userId for compatibility
        req.user = {
            id: user.id,
            userId: user.id, // ✅ Added this for consistency
            email: user.email,
            role: user.role,
            is_verified: user.is_verified
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: "Invalid token. Please login again."
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: "Token expired. Please login again."
            });
        }

        console.error("Auth middleware error:", error);
        res.status(500).json({
            success: false,
            error: "Authentication failed"
        });
    }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required"
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: "Access denied. Admin privileges required."
        });
    }

    next();
};

// Check if user is verified
export const isVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required"
        });
    }

    if (!req.user.is_verified) {
        return res.status(403).json({
            success: false,
            error: "Email verification required. Please verify your email."
        });
    }

    next();
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userResult = await pool.query(
            "SELECT id, email, role, is_active, is_verified FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
            const user = userResult.rows[0];
            // ✅ Set both id and userId for compatibility
            req.user = {
                id: user.id,
                userId: user.id, // ✅ Added this for consistency
                email: user.email,
                role: user.role,
                is_verified: user.is_verified
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};