// src/routes/tracerStudyRoutes.js
import express from "express";
import tracerStudyController from "../controllers/tracerStudyController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==================== RESPONSES ====================

// Protected routes (authentication required)
router.get("/my-response", verifyToken, tracerStudyController.getMyResponse);
router.get("/check-status", verifyToken, tracerStudyController.checkSubmissionStatus);
router.post("/submit", verifyToken, tracerStudyController.submitResponse);
router.put("/responses/:id", verifyToken, tracerStudyController.updateResponse); // Owner only

// Admin routes
router.get("/responses", verifyToken, isAdmin, tracerStudyController.getAllResponses);
router.get("/responses/:id", verifyToken, isAdmin, tracerStudyController.getResponseById);
router.delete("/responses/:id", verifyToken, isAdmin, tracerStudyController.deleteResponse);
router.get("/export", verifyToken, isAdmin, tracerStudyController.exportResponses);

// ==================== ANALYTICS ====================

// Public analytics routes (can be viewed by anyone)
router.get("/analytics", tracerStudyController.getAnalytics);
router.get("/analytics/programme/:programme", tracerStudyController.getAnalyticsByProgramme);
router.get("/analytics/year/:year", tracerStudyController.getAnalyticsByYear);

// ==================== MENTORS ====================

router.get("/mentors", tracerStudyController.getMentorsList);

export default router;