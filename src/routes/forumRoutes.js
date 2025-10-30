// src/routes/forumRoutes.js
import express from "express";
import forumController from "../controllers/forumController.js";

const router = express.Router();

// ==================== CATEGORIES ====================
router.get("/categories", forumController.getAllCategories);
router.get("/categories/:id", forumController.getCategoryById);
router.post("/categories", forumController.createCategory);
router.put("/categories/:id", forumController.updateCategory);
router.delete("/categories/:id", forumController.deleteCategory);

// ==================== POSTS ====================
router.get("/posts", forumController.getAllPosts);
router.get("/posts/popular", forumController.getPopularPosts);
router.get("/posts/trending", forumController.getTrendingPosts);
router.get("/posts/my-posts", forumController.getMyPosts);
router.get("/posts/:id", forumController.getPostById);
router.post("/posts", forumController.createPost);
router.put("/posts/:id", forumController.updatePost);
router.delete("/posts/:id", forumController.deletePost);

// Post actions
router.post("/posts/:id/view", forumController.incrementPostViews);
router.post("/posts/:id/like", forumController.likePost);
router.delete("/posts/:id/unlike", forumController.unlikePost);
router.post("/posts/:id/pin", forumController.pinPost);
router.post("/posts/:id/unpin", forumController.unpinPost);
router.post("/posts/:id/lock", forumController.lockPost);
router.post("/posts/:id/unlock", forumController.unlockPost);
router.post("/posts/:id/subscribe", forumController.subscribeToPost);
router.delete("/posts/:id/unsubscribe", forumController.unsubscribeFromPost);

// ==================== REPLIES ====================
router.get("/posts/:id/replies", forumController.getPostReplies);
router.get("/posts/:id/replies/:replyId/nested", forumController.getNestedReplies);
router.post("/posts/:id/replies", forumController.addReply);
router.post("/posts/:id/replies/:replyId/reply", forumController.replyToReply);
router.put("/posts/:id/replies/:replyId", forumController.updateReply);
router.delete("/posts/:id/replies/:replyId", forumController.deleteReply);
router.post("/posts/:id/replies/:replyId/like", forumController.likeReply);
router.delete("/posts/:id/replies/:replyId/unlike", forumController.unlikeReply);
router.post("/posts/:id/replies/:replyId/solution", forumController.markAsSolution);

// ==================== STATISTICS ====================
router.get("/stats", forumController.getForumStats);

export default router;