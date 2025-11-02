// src/routes/academicRoutes.js
import express from "express";
import academicController from "../controllers/academicController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==================== PROGRAM LEVELS ====================
router.get("/program-levels", academicController.getAllProgramLevels);

// ==================== FACULTIES ====================
router.get("/faculties", academicController.getAllFaculties);
router.get("/faculties/stats", academicController.getFacultyStats);
router.get("/faculties/:id", academicController.getFacultyById);
router.post("/faculties", verifyToken, isAdmin, academicController.createFaculty);
router.put("/faculties/:id", verifyToken, isAdmin, academicController.updateFaculty);

// ==================== DEPARTMENTS ====================
router.get("/departments", academicController.getAllDepartments);
router.get("/departments/stats", academicController.getDepartmentStats);
router.get("/departments/:id", academicController.getDepartmentById);
router.post("/departments", verifyToken, isAdmin, academicController.createDepartment);
router.put("/departments/:id", verifyToken, isAdmin, academicController.updateDepartment);

// ==================== PROGRAMS ====================
router.get("/programs", academicController.getAllPrograms);
router.get("/programs/:id", academicController.getProgramById);
router.post("/programs", verifyToken, isAdmin, academicController.createProgram);
router.put("/programs/:id", verifyToken, isAdmin, academicController.updateProgram);
router.delete("/programs/:id", verifyToken, isAdmin, academicController.deleteProgram);

// ==================== DROPDOWN DATA ====================
router.get("/dropdown-data", academicController.getDropdownData);

export default router;