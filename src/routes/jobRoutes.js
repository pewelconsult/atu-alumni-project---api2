// src/routes/jobRoutes.js
import express from "express";
import jobController from "../controllers/jobController.js";
import { verifyToken, isAdmin, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public/Alumni routes (can browse without login)
router.get("/", optionalAuth, jobController.getAllJobs);
router.get("/stats", jobController.getJobStats);
router.get("/:id", optionalAuth, jobController.getJobById);
router.post("/:id/view", optionalAuth, jobController.incrementViewCount);

// Protected routes (authentication required)
router.get("/my-applications", verifyToken, jobController.getMyApplications);
router.get("/saved", verifyToken, jobController.getSavedJobs);
router.post("/:id/apply", verifyToken, jobController.applyToJob);
router.post("/:id/save", verifyToken, jobController.saveJob);
router.delete("/:id/unsave", verifyToken, jobController.unsaveJob);

// Admin only routes
router.post("/", verifyToken, isAdmin, jobController.createJob); // ✅ Admin only
router.put("/:id", verifyToken, isAdmin, jobController.updateJob); // ✅ Admin only
router.delete("/:id", verifyToken, isAdmin, jobController.deleteJob); // ✅ Admin only
router.get("/:id/applications", verifyToken, isAdmin, jobController.getJobApplications); // ✅ Admin only
router.put("/:id/applications/:appId", verifyToken, isAdmin, jobController.updateApplicationStatus); // ✅ Admin only

export default router;