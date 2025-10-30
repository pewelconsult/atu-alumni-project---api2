// src/routes/userRoutes.js
import express from "express";
import userController from "../controllers/userController.js";

const router = express.Router();

// @route   GET /api/users
router.get("/", userController.getAllUsers);

// @route   GET /api/users/stats/overview
router.get("/stats/overview", userController.getUserStats);

// @route   GET /api/users/:id
router.get("/:id", userController.getUserById);

// @route   PUT /api/users/:id
router.put("/:id", userController.updateUser);

// @route   PATCH /api/users/:id/password
router.patch("/:id/password", userController.updatePassword);

// @route   DELETE /api/users/:id
router.delete("/:id", userController.deleteUser);

// @route   POST /api/users/:id/reactivate
router.post("/:id/reactivate", userController.reactivateUser);

export default router;