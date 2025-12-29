import { Request, Response } from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của user
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.userId; // Từ verifyToken middleware
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const isReadQuery = req.query.isRead as string;

    let isRead: boolean | undefined;
    if (isReadQuery === "true") isRead = true;
    if (isReadQuery === "false") isRead = false;

    const result = await getUserNotifications(userId, { page, limit, isRead });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Error in getNotifications:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách thông báo",
    });
  }
}

/**
 * GET /api/notifications/unread-count
 * Đếm số thông báo chưa đọc
 */
export async function getNotificationUnreadCount(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const count = await getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error("Error in getNotificationUnreadCount:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi đếm thông báo",
    });
  }
}

/**
 * PUT /api/notifications/:id/mark-read
 * Đánh dấu thông báo đã đọc
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const notificationId = parseInt(req.params.id, 10);

    const success = await markNotificationAsRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo hoặc không có quyền",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã đánh dấu đọc",
    });
  } catch (error: any) {
    console.error("Error in markAsRead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi đánh dấu đọc",
    });
  }
}

/**
 * PUT /api/notifications/mark-all-read
 * Đánh dấu tất cả thông báo đã đọc
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const count = await markAllNotificationsAsRead(userId);

    return res.status(200).json({
      success: true,
      message: `Đã đánh dấu ${count} thông báo`,
      count,
    });
  } catch (error: any) {
    console.error("Error in markAllAsRead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi đánh dấu tất cả đọc",
    });
  }
}
