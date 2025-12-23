// import { Response, NextFunction } from "express";
// import { AuthRequest } from "./auth.middlewares";
// import { RoleCode } from "../constant/role";

// export const requireRole =
//   (...allowedRoles: RoleCode[]) =>
//   (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "UNAUTHORIZED",
//       });
//     }

//     if (!allowedRoles.includes(req.user.roleId)) {
//       return res.status(403).json({
//         success: false,
//         message: "FORBIDDEN",
//       });
//     }

//     next();
//   };
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
