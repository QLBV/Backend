import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import SystemSettings from "../models/SystemSettings";
import { RoleCode } from "../constant/role";
import logger from "../utils/logger";

let maintenanceMode: boolean | null = null;
let lastCheck: number = 0;
const CACHE_TTL_MS = 30000; 
const checkMaintenanceMode = async (): Promise<boolean> => {
  const now = Date.now();  
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
    return false;
  }
};

export const clearMaintenanceCache = () => {
  maintenanceMode = null;
  lastCheck = 0;
};

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
    return null;
  }
};
export const checkMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isMaintenanceMode = await checkMaintenanceMode();
    if (!isMaintenanceMode) {
      return next();
    }
    const roleId = getRoleIdFromToken(req);
    if (roleId === null) {
      return next();
    }
    if (roleId === RoleCode.ADMIN) {
      return next();
    }
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
    next();
  }
};

