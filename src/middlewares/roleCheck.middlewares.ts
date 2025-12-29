import { Request, Response, NextFunction } from "express";
import { RoleCode } from "../constant/role";

export const requireRole = (...allowedRoles: RoleCode[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleId = req.user?.roleId;

    if (!roleId || !allowedRoles.includes(roleId)) {
      return res.status(403).json({
        success: false,
        message: "FORBIDDEN",
      });
    }

    next();
  };
};
