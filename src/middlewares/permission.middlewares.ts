import { Request, Response, NextFunction } from "express";
import Role from "../models/Role";
import Permission from "../models/Permission";
   
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