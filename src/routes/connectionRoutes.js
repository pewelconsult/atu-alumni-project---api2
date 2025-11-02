// src/routes/connectionRoutes.js
import express from "express";
import connectionController from "../controllers/connectionController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Send connection request
router.post("/requests", connectionController.sendConnectionRequest);

// Get pending requests (received)
router.get("/requests/pending", connectionController.getPendingRequests);

// Get sent requests
router.get("/requests/sent", connectionController.getSentRequests);

// Accept connection request
router.post("/requests/:request_id/accept", connectionController.acceptConnectionRequest);

// Decline connection request
router.post("/requests/:request_id/decline", connectionController.declineConnectionRequest);

// Cancel connection request
router.post("/requests/:request_id/cancel", connectionController.cancelConnectionRequest);

// Get my connections
router.get("/", connectionController.getMyConnections);

// Remove connection
router.delete("/:connection_id", connectionController.removeConnection);

// Check connection status
router.get("/status/:user_id", connectionController.checkConnectionStatus);

// Get connection statistics
router.get("/stats/overview", connectionController.getConnectionStats);

export default router;