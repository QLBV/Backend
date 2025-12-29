import { Router } from "express";
import {
  getNotifications,
  getNotificationUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = Router();

// Tất cả routes cần authentication
router.use(verifyToken);

// GET /api/notifications - Lấy danh sách thông báo
router.get("/", getNotifications);

// GET /api/notifications/unread-count - Đếm số chưa đọc
router.get("/unread-count", getNotificationUnreadCount);

// PUT /api/notifications/mark-all-read - Đánh dấu tất cả đã đọc
router.put("/mark-all-read", markAllAsRead);

// PUT /api/notifications/:id/mark-read - Đánh dấu 1 cái đã đọc
router.put("/:id/mark-read", markAsRead);

export default router;
