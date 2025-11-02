// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import pool from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import tracerStudyRoutes from "./routes/tracerStudyRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";


// Import middlewares
import { apiLimiter } from "./middlewares/rateLimitMiddleware.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Security middlewares
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for all routes
app.use('/api/', apiLimiter);

// Root route
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT current_database(), NOW() as server_time");
        res.json({
            success: true,
            message: "🎓 ATU Alumni Network API",
            version: "1.0.0",
            database: result.rows[0].current_database,
            server_time: result.rows[0].server_time,
            endpoints: {
                auth: "/api/auth",
                users: "/api/users",
                jobs: "/api/jobs",
                events: "/api/events",
                forums: "/api/forums",
                news: "/api/news",
                tracerStudy: "/api/tracer-study",
                academic: "/api/academic",
                messages: "/api/messages"
            }
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            error: "Database connection failed"
        });
    }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/forums", forumRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/tracer-study", tracerStudyRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/admin/users", adminUserRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({
            success: true,
            status: "healthy",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: "unhealthy",
            database: "disconnected",
            error: error.message
        });
    }
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🎓 ATU Alumni Network API            ║
║                                        ║
║  Server: http://localhost:${port}       ║
║  Status: Running ✅                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════╝

📚 API Documentation:
   - Auth:          /api/auth
   - Users:         /api/users
   - Jobs:          /api/jobs
   - Events:        /api/events
   - Forums:        /api/forums
   - News:          /api/news
   - Tracer Study:  /api/tracer-study
   - Academic:      /api/academic
   - Messages:      /api/messages

🔍 Health Check:    /health
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // In production, you might want to close the server
    // server.close(() => process.exit(1));
});