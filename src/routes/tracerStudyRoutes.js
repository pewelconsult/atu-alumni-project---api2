// src/routes/tracerStudyRoutes.js
import express from "express";
import tracerStudyController from "../controllers/tracerStudyController.js";

const router = express.Router();

// ==================== RESPONSES ====================

// Public/Alumni routes
router.get("/my-response", tracerStudyController.getMyResponse);
router.get("/check-status", tracerStudyController.checkSubmissionStatus);
router.post("/submit", tracerStudyController.submitResponse);
router.put("/responses/:id", tracerStudyController.updateResponse);

// Admin routes
router.get("/responses", tracerStudyController.getAllResponses);
router.get("/responses/:id", tracerStudyController.getResponseById);
router.delete("/responses/:id", tracerStudyController.deleteResponse);
router.get("/export", tracerStudyController.exportResponses);

// ==================== ANALYTICS ====================

// Public analytics routes
router.get("/analytics", tracerStudyController.getAnalytics);
router.get("/analytics/programme/:programme", tracerStudyController.getAnalyticsByProgramme);
router.get("/analytics/year/:year", tracerStudyController.getAnalyticsByYear);

// ==================== MENTORS ====================

router.get("/mentors", tracerStudyController.getMentorsList);

export default router;