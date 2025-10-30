// src/routes/jobRoutes.js
import express from "express";
import jobController from "../controllers/jobController.js";

const router = express.Router();

// Public/Alumni routes
router.get("/", jobController.getAllJobs);
router.get("/stats", jobController.getJobStats);
router.get("/my-applications", jobController.getMyApplications);
router.get("/saved", jobController.getSavedJobs);
router.get("/:id", jobController.getJobById);

// Job actions
router.post("/:id/view", jobController.incrementViewCount);
router.post("/:id/apply", jobController.applyToJob);
router.post("/:id/save", jobController.saveJob);
router.delete("/:id/unsave", jobController.unsaveJob);

// Admin routes
router.post("/", jobController.createJob);
router.put("/:id", jobController.updateJob);
router.delete("/:id", jobController.deleteJob);
router.get("/:id/applications", jobController.getJobApplications);
router.put("/:id/applications/:appId", jobController.updateApplicationStatus);

export default router;