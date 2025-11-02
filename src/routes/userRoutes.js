// src/routes/userRoutes.js
import express from "express";
import userController from "../controllers/userController.js";
import { verifyToken, isAdmin, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (no authentication required, but can be enhanced with optional auth)
router.get("/", optionalAuth, userController.getAllUsers);
router.get("/stats/overview", userController.getUserStats);
router.get("/:id", optionalAuth, userController.getUserById);

// Protected routes (authentication required - user can only update themselves)
router.put("/:id", verifyToken, userController.updateUser); // User updates their own profile
router.patch("/:id/password", verifyToken, userController.updatePassword); // User changes their own password

// Admin only routes
router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);
router.post("/:id/reactivate", verifyToken, isAdmin, userController.reactivateUser);

export default router;