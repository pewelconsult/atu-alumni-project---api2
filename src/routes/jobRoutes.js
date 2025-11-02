// src/routes/jobRoutes.js
import express from "express";
import jobController from "../controllers/jobController.js";
import { verifyToken, isAdmin, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public/Alumni routes (can browse without login)
router.get("/", optionalAuth, jobController.getAllJobs);
router.get("/stats", jobController.getJobStats);

// Protected routes (authentication required)
// IMPORTANT: Put specific routes BEFORE parameterized routes
router.get("/saved/ids", verifyToken, jobController.getSavedJobIds); // ✅ NEW - Must be before /:id
router.get("/saved", verifyToken, jobController.getSavedJobs);
router.get("/my-applications", verifyToken, jobController.getMyApplications);

// Job ID routes (must come after specific routes)
router.get("/:id", optionalAuth, jobController.getJobById);
router.post("/:id/view", optionalAuth, jobController.incrementViewCount);
router.post("/:id/apply", verifyToken, jobController.applyToJob);
router.post("/:id/save", verifyToken, jobController.saveJob);
router.delete("/:id/unsave", verifyToken, jobController.unsaveJob);

// Admin only routes
router.post("/", verifyToken, isAdmin, jobController.createJob);
router.put("/:id", verifyToken, isAdmin, jobController.updateJob);
router.delete("/:id", verifyToken, isAdmin, jobController.deleteJob);
router.get("/:id/applications", verifyToken, isAdmin, jobController.getJobApplications);
router.put("/:id/applications/:appId", verifyToken, isAdmin, jobController.updateApplicationStatus);

export default router;