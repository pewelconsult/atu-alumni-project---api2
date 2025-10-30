// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import tracerStudyRoutes from "./routes/tracerStudyRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";  // ✅ Add this

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

//Middlewares
app.use(express.json());
app.use(cors());

//Routes
app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT current_database()");
        res.json({
            success: true,
            message: "ATU Alumni Network API",
            database: result.rows[0].current_database
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
app.use("/api/academic", academicRoutes);  // ✅ Add this line

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({
            success: true,
            message: "Server and database are healthy",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
        success: false,
        error: "Internal server error"
    });
});

//Server running
app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🎓 ATU Alumni Network API            ║
║                                        ║
║  Server: http://localhost:${port}       ║
║  Status: Running ✅                    ║
╚════════════════════════════════════════╝
    `);
});