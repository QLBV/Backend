import { Request, Response, NextFunction } from "express";
import { RoleCode } from "../constant/role";

export const requirePatientContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.roleId !== RoleCode.PATIENT) return next();
  if (!req.user?.patientId) {
    return res
      .status(400)
      .json({ success: false, message: "PATIENT_NOT_SETUP" });
  }
  return next();
};

export const requireDoctorContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.roleId !== RoleCode.DOCTOR) return next();
  if (!req.user?.doctorId) {
    return res
      .status(400)
      .json({ success: false, message: "DOCTOR_PROFILE_NOT_FOUND" });
  }
  return next();
};
