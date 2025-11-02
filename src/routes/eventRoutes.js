// src/routes/eventRoutes.js
import express from "express";
import eventController from "../controllers/eventController.js";
import { verifyToken, isAdmin, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public/Alumni routes (can browse without login)
router.get("/", optionalAuth, eventController.getAllEvents);
router.get("/upcoming", optionalAuth, eventController.getUpcomingEvents);
router.get("/past", optionalAuth, eventController.getPastEvents);
router.get("/stats", eventController.getEventStats);
router.get("/:id", optionalAuth, eventController.getEventById);
router.get("/:id/comments", optionalAuth, eventController.getEventComments);
router.get("/:id/comments/:commentId/replies", optionalAuth, eventController.getCommentReplies);
router.post("/:id/view", optionalAuth, eventController.incrementViewCount);

// Protected routes (authentication required)
router.get("/my-events", verifyToken, eventController.getMyEvents);
router.post("/:id/rsvp", verifyToken, eventController.rsvpToEvent);
router.put("/:id/rsvp", verifyToken, eventController.updateRsvp);
router.delete("/:id/rsvp", verifyToken, eventController.cancelRsvp);

// Comments (authentication required)
router.post("/:id/comments", verifyToken, eventController.addComment);
router.post("/:id/comments/:commentId/reply", verifyToken, eventController.replyToComment);
router.put("/:id/comments/:commentId", verifyToken, eventController.updateComment); // Owner only
router.delete("/:id/comments/:commentId", verifyToken, eventController.deleteComment); // Owner or admin
router.post("/:id/comments/:commentId/like", verifyToken, eventController.likeComment);
router.delete("/:id/comments/:commentId/unlike", verifyToken, eventController.unlikeComment);

// Admin only routes
router.post("/", verifyToken, isAdmin, eventController.createEvent); // ✅ Admin only
router.put("/:id", verifyToken, isAdmin, eventController.updateEvent); // ✅ Admin only
router.delete("/:id", verifyToken, isAdmin, eventController.deleteEvent); // ✅ Admin only
router.post("/:id/publish", verifyToken, isAdmin, eventController.publishEvent); // ✅ Admin only
router.get("/:id/attendees", verifyToken, isAdmin, eventController.getEventAttendees); // ✅ Admin only
router.put("/:id/attendees/:userId", verifyToken, isAdmin, eventController.checkInAttendee); // ✅ Admin only

export default router;