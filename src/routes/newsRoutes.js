// src/routes/newsRoutes.js
import express from "express";
import newsController from "../controllers/newsController.js";

const router = express.Router();

// Public/Alumni routes
router.get("/", newsController.getAllArticles);
router.get("/featured", newsController.getFeaturedArticles);
router.get("/latest", newsController.getLatestArticles);
router.get("/popular", newsController.getPopularArticles);
router.get("/stats", newsController.getNewsStats);
router.get("/:id", newsController.getArticleById);
router.get("/slug/:slug", newsController.getArticleBySlug);

// Article actions
router.post("/:id/view", newsController.incrementViewCount);
router.post("/:id/like", newsController.likeArticle);
router.delete("/:id/unlike", newsController.unlikeArticle);

// Comments
router.get("/:id/comments", newsController.getArticleComments);
router.post("/:id/comments", newsController.addComment);
router.put("/:id/comments/:commentId", newsController.updateComment);
router.delete("/:id/comments/:commentId", newsController.deleteComment);
router.post("/:id/comments/:commentId/like", newsController.likeComment);
router.delete("/:id/comments/:commentId/unlike", newsController.unlikeComment);

// Admin routes
router.post("/", newsController.createArticle);
router.put("/:id", newsController.updateArticle);
router.delete("/:id", newsController.deleteArticle);
router.post("/:id/publish", newsController.publishArticle);
router.post("/:id/unpublish", newsController.unpublishArticle);

export default router;