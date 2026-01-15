import { Request, Response, NextFunction } from "express";
import { RoleCode } from "../constant/role";

export const requireRole = (...allowedRoles: RoleCode[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleId = req.user?.roleId;
    let normalizedRoleId: number | null = null;
    if (roleId !== undefined && roleId !== null) {
      const num = typeof roleId === "string" ? parseInt(roleId, 10) : roleId;
      normalizedRoleId = !isNaN(num) ? num : null;
    }

    if (
      !normalizedRoleId ||
      !allowedRoles.includes(normalizedRoleId as RoleCode)
    ) {
      return res.status(403).json({
        success: false,
        message: "FORBIDDEN",
      });
    }

    next();
  };
};
