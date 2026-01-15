import { Request, Response } from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification.service";


export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.userId; 
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


export async function deleteNotificationController(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const notificationId = parseInt(req.params.id, 10);

    const success = await deleteNotification(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo hoặc không có quyền",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa thông báo",
    });
  } catch (error: any) {
    console.error("Error in deleteNotificationController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xóa thông báo",
    });
  }
}
