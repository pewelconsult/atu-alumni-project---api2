// src/routes/authRoutes.js
import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

// @route   POST /api/auth/register
router.post("/register", authController.register);

export default router;