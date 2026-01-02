import { Router } from "express";
import {
  getNotifications,
  getNotificationUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotificationController,
} from "../controllers/notification.controller";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = Router();

// Tất cả routes cần authentication
router.use(verifyToken);

// GET /api/notifications - Lấy danh sách thông báo
router.get("/", getNotifications);

// GET /api/notifications/unread-count - Đếm số chưa đọc
router.get("/unread-count", getNotificationUnreadCount);

// PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.put("/read-all", markAllAsRead);

// PUT /api/notifications/:id/read - Đánh dấu 1 cái đã đọc
router.put("/:id/read", markAsRead);

// DELETE /api/notifications/:id - Xóa thông báo
router.delete("/:id", deleteNotificationController);

export default router;
