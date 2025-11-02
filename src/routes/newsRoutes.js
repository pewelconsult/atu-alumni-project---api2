// src/routes/newsRoutes.js
import express from "express";
import newsController from "../controllers/newsController.js";
import { verifyToken, isAdmin, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public/Alumni routes (can browse without login)
router.get("/", optionalAuth, newsController.getAllArticles);
router.get("/featured", optionalAuth, newsController.getFeaturedArticles);
router.get("/latest", optionalAuth, newsController.getLatestArticles);
router.get("/popular", optionalAuth, newsController.getPopularArticles);
router.get("/stats", newsController.getNewsStats);
router.get("/:id", optionalAuth, newsController.getArticleById);
router.get("/slug/:slug", optionalAuth, newsController.getArticleBySlug);
router.get("/:id/comments", optionalAuth, newsController.getArticleComments);
router.post("/:id/view", optionalAuth, newsController.incrementViewCount);

// Protected routes (authentication required)
router.post("/:id/like", verifyToken, newsController.likeArticle);
router.delete("/:id/unlike", verifyToken, newsController.unlikeArticle);

// Comments (authentication required)
router.post("/:id/comments", verifyToken, newsController.addComment);
router.put("/:id/comments/:commentId", verifyToken, newsController.updateComment); // Owner only
router.delete("/:id/comments/:commentId", verifyToken, newsController.deleteComment); // Owner or admin
router.post("/:id/comments/:commentId/like", verifyToken, newsController.likeComment);
router.delete("/:id/comments/:commentId/unlike", verifyToken, newsController.unlikeComment);

// Admin only routes
router.post("/", verifyToken, isAdmin, newsController.createArticle); // ✅ Admin only
router.put("/:id", verifyToken, isAdmin, newsController.updateArticle); // ✅ Admin only
router.delete("/:id", verifyToken, isAdmin, newsController.deleteArticle); // ✅ Admin only
router.post("/:id/publish", verifyToken, isAdmin, newsController.publishArticle); // ✅ Admin only
router.post("/:id/unpublish", verifyToken, isAdmin, newsController.unpublishArticle); // ✅ Admin only

export default router;