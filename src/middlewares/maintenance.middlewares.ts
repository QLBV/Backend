import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import SystemSettings from "../models/SystemSettings";
import { RoleCode } from "../constant/role";
import logger from "../utils/logger";

// Cache để tránh query database quá nhiều
let maintenanceMode: boolean | null = null;
let lastCheck: number = 0;
const CACHE_TTL_MS = 30000; // 30 giây

/**
 * Kiểm tra trạng thái bảo trì từ database với cache
 */
const checkMaintenanceMode = async (): Promise<boolean> => {
  const now = Date.now();

  // Sử dụng cache nếu còn hạn
  if (maintenanceMode !== null && now - lastCheck < CACHE_TTL_MS) {
    return maintenanceMode;
  }

  try {
    const settings = await SystemSettings.findOne();
    maintenanceMode = settings?.systemSettings?.maintenanceMode ?? false;
    lastCheck = now;
    return maintenanceMode;
  } catch (error) {
    logger.error("Error checking maintenance mode:", error);
    // Nếu có lỗi, mặc định là không bảo trì để không chặn hệ thống
    return false;
  }
};

/**
 * Xóa cache khi cập nhật settings (gọi từ controller)
 */
export const clearMaintenanceCache = () => {
  maintenanceMode = null;
  lastCheck = 0;
};

/**
 * Lấy roleId từ JWT token trong header
 */
const getRoleIdFromToken = (req: Request): number | null => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { roleId?: number | string };

    if (decoded.roleId !== undefined && decoded.roleId !== null) {
      const num =
        typeof decoded.roleId === "string"
          ? parseInt(decoded.roleId, 10)
          : decoded.roleId;
      return !isNaN(num) ? num : null;
    }
    return null;
  } catch {
    // Token không hợp lệ hoặc hết hạn - để auth middleware xử lý
    return null;
  }
};

/**
 * Middleware kiểm tra chế độ bảo trì
 * - Nếu hệ thống đang bảo trì, chỉ cho phép Admin truy cập
 * - Các role khác sẽ nhận thông báo lỗi 503
 * - Request chưa xác thực sẽ được cho qua để auth middleware xử lý
 */
export const checkMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isMaintenanceMode = await checkMaintenanceMode();

    // Nếu không ở chế độ bảo trì, cho phép tất cả
    if (!isMaintenanceMode) {
      return next();
    }

    // Lấy roleId từ JWT token (parse trực tiếp, không dựa vào req.user)
    const roleId = getRoleIdFromToken(req);

    // Nếu không có token hoặc không parse được, cho phép tiếp tục
    // Auth middleware sẽ xử lý việc xác thực sau
    if (roleId === null) {
      return next();
    }

    // Cho phép Admin truy cập trong chế độ bảo trì
    if (roleId === RoleCode.ADMIN) {
      return next();
    }

    // Chặn các role khác (đã xác thực nhưng không phải admin)
    logger.warn(
      `Maintenance mode: Blocked access for role ${roleId} on ${req.method} ${req.path}`
    );

    return res.status(503).json({
      success: false,
      message:
        "Hệ thống đang bảo trì. Vui lòng quay lại sau. Chỉ quản trị viên mới có thể truy cập.",
      code: "MAINTENANCE_MODE",
    });
  } catch (error) {
    logger.error("Error in maintenance middleware:", error);
    // Nếu có lỗi, cho phép tiếp tục để không chặn hệ thống
    next();
  }
};

