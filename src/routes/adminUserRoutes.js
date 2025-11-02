// src/routes/adminUserRoutes.js
import express from "express";
import adminUserController from "../controllers/adminUserController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken, isAdmin);

// Bulk import alumni with auto-credentials
router.post("/import-alumni", adminUserController.bulkImportAlumni);

// Add single alumni
router.post("/add-alumni", adminUserController.addSingleAlumni);

// Resend credentials to specific user
router.post("/resend-credentials/:user_id", adminUserController.resendCredentials);

export default router;