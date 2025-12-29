import { Request, Response, NextFunction } from "express";
import Role from "../models/Role";
import Permission from "../models/Permission";

/**
 * Permission-Based Access Control (PBAC) Middleware
 *
 * Checks if the user's role has the required permission(s)
 * This provides granular control beyond role-based access
 *
 * Example usage:
 * router.get("/medicines", verifyToken, requirePermission("medicines.view"), getMedicines);
 * router.post("/medicines", verifyToken, requirePermission("medicines.create"), createMedicine);
 * router.put("/medicines/:id", verifyToken, requirePermission("medicines.edit"), updateMedicine);
 * router.delete("/medicines/:id", verifyToken, requirePermission("medicines.delete"), deleteMedicine);
 */

/**
 * Check if user has a specific permission
 */
export const requirePermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.roleId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Get user's role with permissions
      const role = await Role.findByPk(user.roleId, {
        include: [
          {
            model: Permission,
            as: "permissions",
            where: { name: permissionName },
            required: false,
          },
        ],
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Role not found",
        });
      }

      // Check if role has the required permission
      const hasPermission = (role as any).permissions?.some(
        (p: Permission) => p.name === permissionName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required: ${permissionName}`,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Permission check failed",
      });
    }
  };
};

/**
 * Check if user has ANY of the specified permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.roleId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const role = await Role.findByPk(user.roleId, {
        include: [
          {
            model: Permission,
            as: "permissions",
          },
        ],
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Role not found",
        });
      }

      // Check if role has ANY of the required permissions
      const hasAnyPermission = (role as any).permissions?.some((p: Permission) =>
        permissions.includes(p.name)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required one of: ${permissions.join(", ")}`,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Permission check failed",
      });
    }
  };
};

/**
 * Check if user has ALL of the specified permissions
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.roleId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const role = await Role.findByPk(user.roleId, {
        include: [
          {
            model: Permission,
            as: "permissions",
          },
        ],
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Role not found",
        });
      }

      const userPermissions = (role as any).permissions?.map((p: Permission) => p.name) || [];

      // Check if role has ALL required permissions
      const hasAllPermissions = permissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter(
          (p) => !userPermissions.includes(p)
        );
        return res.status(403).json({
          success: false,
          message: `Permission denied. Missing: ${missingPermissions.join(", ")}`,
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error?.message || "Permission check failed",
      });
    }
  };
};

/**
 * Helper to get user's permissions (for debugging/UI)
 */
export const getUserPermissions = async (roleId: number): Promise<string[]> => {
  const role = await Role.findByPk(roleId, {
    include: [
      {
        model: Permission,
        as: "permissions",
      },
    ],
  });

  if (!role) {
    return [];
  }

  return (role as any).permissions?.map((p: Permission) => p.name) || [];
};