import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtUserPayload } from "../types/auth";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import { RoleCode } from "../constant/role";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "NO_TOKEN" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtUserPayload;

    // ✅ Luôn gán payload trước
    req.user = decoded;

    // ✅ Bổ sung patientId/doctorId từ DB theo role
    if (decoded.roleId === RoleCode.PATIENT) {
      const patient = await Patient.findOne({
        where: { userId: decoded.userId },
        attributes: ["id"],
      });
      (req.user as any).patientId = patient?.id ?? null;
    }

    if (decoded.roleId === RoleCode.DOCTOR) {
      const doctor = await Doctor.findOne({
        where: { userId: decoded.userId },
        attributes: ["id"],
      });
      (req.user as any).doctorId = doctor?.id ?? null;
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "INVALID_TOKEN" });
  }
};
