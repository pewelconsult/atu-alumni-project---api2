// src/routes/eventRoutes.js
import express from "express";
import eventController from "../controllers/eventController.js";

const router = express.Router();

// Public/Alumni routes
router.get("/", eventController.getAllEvents);
router.get("/upcoming", eventController.getUpcomingEvents);
router.get("/past", eventController.getPastEvents);
router.get("/stats", eventController.getEventStats);
router.get("/my-events", eventController.getMyEvents);
router.get("/:id", eventController.getEventById);

// Event actions
router.post("/:id/view", eventController.incrementViewCount);
router.post("/:id/rsvp", eventController.rsvpToEvent);
router.put("/:id/rsvp", eventController.updateRsvp);
router.delete("/:id/rsvp", eventController.cancelRsvp);

// Comments
router.get("/:id/comments", eventController.getEventComments);
router.get("/:id/comments/:commentId/replies", eventController.getCommentReplies);
router.post("/:id/comments", eventController.addComment);
router.post("/:id/comments/:commentId/reply", eventController.replyToComment);
router.put("/:id/comments/:commentId", eventController.updateComment);
router.delete("/:id/comments/:commentId", eventController.deleteComment);
router.post("/:id/comments/:commentId/like", eventController.likeComment);
router.delete("/:id/comments/:commentId/unlike", eventController.unlikeComment);

// Admin routes
router.post("/", eventController.createEvent);
router.put("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);
router.post("/:id/publish", eventController.publishEvent);
router.get("/:id/attendees", eventController.getEventAttendees);
router.put("/:id/attendees/:userId", eventController.checkInAttendee);

export default router;