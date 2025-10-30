// src/routes/academicRoutes.js
import express from "express";
import academicController from "../controllers/academicController.js";

const router = express.Router();

// ==================== PROGRAM LEVELS ====================
router.get("/program-levels", academicController.getAllProgramLevels);

// ==================== FACULTIES ====================
router.get("/faculties", academicController.getAllFaculties);
router.get("/faculties/stats", academicController.getFacultyStats);
router.get("/faculties/:id", academicController.getFacultyById);
router.post("/faculties", academicController.createFaculty); // Admin
router.put("/faculties/:id", academicController.updateFaculty); // Admin

// ==================== DEPARTMENTS ====================
router.get("/departments", academicController.getAllDepartments);
router.get("/departments/stats", academicController.getDepartmentStats);
router.get("/departments/:id", academicController.getDepartmentById);
router.post("/departments", academicController.createDepartment); // Admin
router.put("/departments/:id", academicController.updateDepartment); // Admin

// ==================== PROGRAMS ====================
router.get("/programs", academicController.getAllPrograms);
router.get("/programs/:id", academicController.getProgramById);
router.post("/programs", academicController.createProgram); // Admin
router.put("/programs/:id", academicController.updateProgram); // Admin
router.delete("/programs/:id", academicController.deleteProgram); // Admin

// ==================== DROPDOWN DATA ====================
router.get("/dropdown-data", academicController.getDropdownData);

export default router;