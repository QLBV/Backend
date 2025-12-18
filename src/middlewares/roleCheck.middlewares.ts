import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middlewares";
import Role from "../models/Role";
import Permission from "../models/Permission";

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.toUpperCase();
    const normalizedRoles = allowedRoles.map((r) => r.toUpperCase());

    if (!userRole || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient role.",
      });
    }

    next();
  };
};

export const requirePermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: "Access denied. No role found.",
        });
      }

      const role = await Role.findOne({
        where: { name: userRole },
        include: [
          {
            model: Permission,
            as: "permissions",
            where: { name: permissionName },
            required: false,
          },
        ],
      });

      if (!role || !(role as any).permissions?.length) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Missing permission: ${permissionName}`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};
