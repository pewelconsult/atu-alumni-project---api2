// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import pool from "./config/db.js";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

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
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from "./routes/uploadRoutes.js";

// Import middlewares
import { apiLimiter } from "./middlewares/rateLimitMiddleware.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== MIDDLEWARE CONFIGURATION ==================

// 1. Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS
// 2. CORS
app.use(cors({
    origin: [
        'https://atu-alumni-network.web.app',
        'https://atu-alumni-network.firebaseapp.com',
        'http://localhost:4200',
        'http://localhost:3000',
        'http://localhost:5173' 
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.set('trust proxy', 1);

// 3. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate limiting for API routes
app.use('/api/', apiLimiter);

// ================== ROUTES ==================

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
                messages: "/api/messages",
                notifications: "/api/notifications",
                connections: "/api/connections",
                upload: "/api/upload",
                uploads: "/api/uploads"
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

// Health check
app.get("/api/health", async (req, res) => {
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

// Test endpoint to list uploaded files
app.get("/api/test/images", (req, res) => {
    try {
        const profilesDir = path.join(__dirname, '../public/uploads/profiles');
        
        if (!fs.existsSync(profilesDir)) {
            return res.status(404).json({
                success: false,
                error: "Upload directory not found",
                path: profilesDir
            });
        }
        
        const files = fs.readdirSync(profilesDir);
        
        res.json({
            success: true,
            directory: profilesDir,
            count: files.length,
            files: files,
            urls: files.map(f => `http://localhost:${port}/api/uploads/profiles/${f}`)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ================== API ROUTES ==================

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
app.use('/api/notifications', notificationRoutes);
app.use("/api/upload", uploadRoutes);

// ================== STATIC FILES ==================

// Serve static files at /api/uploads (consistent with /api prefix)
const uploadsPath = path.join(__dirname, '../public/uploads');
console.log('📁 Serving static files from:', uploadsPath);

app.use('/api/uploads', express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
        // Set proper MIME types
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        } else if (filePath.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        }
    }
}));

// ================== ERROR HANDLERS ==================

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ================== START SERVER ==================

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
   - Notifications: /api/notifications
   - Connections:   /api/connections
   - Upload:        /api/upload

🖼️  Static Files:    /api/uploads
🔍 Health Check:    /api/health
📊 Test Images:     /api/test/images
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});
