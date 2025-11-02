// src/routes/messageRoutes.js
import express from "express";
import messageController from "../controllers/messageController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { messageLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

// ==================== ALL ROUTES REQUIRE AUTHENTICATION ====================
// Apply authentication middleware to all routes
router.use(verifyToken);

// ==================== CONVERSATIONS ====================
router.get("/conversations", messageController.getUserConversations);
router.post("/conversations", messageController.getOrCreateConversation);
router.get("/conversations/:id", messageController.getConversationById);
router.post("/conversations/:id/archive", messageController.archiveConversation);
router.post("/conversations/:id/unarchive", messageController.unarchiveConversation);
router.post("/conversations/:id/block", messageController.blockConversation);
router.post("/conversations/:id/unblock", messageController.unblockConversation);
router.delete("/conversations/:id", messageController.deleteConversation);

// ==================== MESSAGES ====================
router.get("/conversations/:conversation_id/messages", messageController.getConversationMessages);
router.post("/messages", messageLimiter, messageController.sendMessage); // Rate limited to prevent spam
router.put("/messages/:id", messageController.editMessage);
router.delete("/messages/:id", messageController.deleteMessage);
router.post("/conversations/:conversation_id/mark-read", messageController.markMessagesAsRead);

// ==================== REACTIONS ====================
router.post("/messages/:message_id/reactions", messageController.addReaction);
router.delete("/messages/:message_id/reactions", messageController.removeReaction);

// ==================== TYPING INDICATORS ====================
router.post("/typing", messageController.setTypingIndicator);
router.get("/conversations/:conversation_id/typing", messageController.getTypingStatus);

// ==================== STATISTICS ====================
router.get("/stats", messageController.getMessagingStats);

export default router;