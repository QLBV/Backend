import { Request, Response, NextFunction } from "express";
import { RoleCode } from "../constant/role";

/**
 * Patient chỉ được thao tác trên chính patientId của mình.
 * Staff (ADMIN/DOCTOR/RECEPTIONIST) thì bỏ qua.
 *
 * YÊU CẦU: verifyToken phải set req.user (có role và patientId).
 */
export const requireSelfPatient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user: any = (req as any).user;

  if (!user) return res.status(401).json({ message: "UNAUTHORIZED" });

  if (user.roleId !== RoleCode.PATIENT) return next();

  const paramId = Number(req.params.id);
  const myPatientId = Number(user.patientId);

  if (!myPatientId || paramId !== myPatientId) {
    return res.status(403).json({ message: "FORBIDDEN" });
  }

  next();
};
