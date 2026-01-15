import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtUserPayload } from "../types/auth";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import { RoleCode } from "../constant/role";
import { TokenBlacklistService } from "../config/redis.config";

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
    const isBlacklisted = await TokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "TOKEN_REVOKED",
      });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtUserPayload;
    req.user = decoded;
    (req as any).token = token;

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
