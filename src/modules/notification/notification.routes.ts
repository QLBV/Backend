import { Router } from "express";
import {
  getNotifications,
  getNotificationUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotificationController,
} from "./notification.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";

const router = Router();


router.use(verifyToken);


router.get("/", getNotifications);


router.get("/unread-count", getNotificationUnreadCount);


router.put("/read-all", markAllAsRead);


router.put("/:id/read", markAsRead);


router.delete("/:id", deleteNotificationController);

export default router;
