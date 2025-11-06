import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js'; // ✅ Correct import
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all notifications for current user
router.get('/', notificationController.getNotifications);

// Get unread notifications
router.get('/unread', notificationController.getUnreadNotifications);

// Get notification stats
router.get('/stats', notificationController.getNotificationStats);

// Mark notification as read
router.put('/:id/read', notificationController.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Delete all read notifications
router.delete('/read', notificationController.deleteAllRead);

export default router;