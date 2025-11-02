// src/middlewares/errorMiddleware.js

// 404 Not Found handler
export const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.originalUrl}`
    });
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);

    // Mongoose/PostgreSQL duplicate key error
    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            error: "Duplicate entry. This record already exists."
        });
    }

    // Mongoose/PostgreSQL validation error
    if (err.code === '23502') {
        return res.status(400).json({
            success: false,
            error: "Required field is missing."
        });
    }

    // Foreign key constraint error
    if (err.code === '23503') {
        return res.status(400).json({
            success: false,
            error: "Invalid reference. Related record not found."
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: "Invalid token"
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: "Token expired"
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};