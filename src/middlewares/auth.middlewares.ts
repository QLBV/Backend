import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Patient from "../models/Patient";

export interface JwtUserPayload {
  id: number;
  role: string;
  patientId?: number;
}

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtUserPayload;

    console.log("🔐 Decoded token:", decoded);

    // Tìm Patient theo userId nếu là PATIENT
    if (decoded.role === "PATIENT") {
      console.log("🔍 Finding patient with userId:", decoded.id);

      const patient = await Patient.findOne({
        where: { userId: decoded.id },
      });

      console.log("👤 Patient found:", patient);

      if (patient) {
        decoded.patientId = patient.id;
        console.log("✅ Added patientId:", patient.id);
      } else {
        console.log("⚠️ No patient found for userId:", decoded.id);
        // ✅ Cho phép tiếp tục - patient sẽ setup profile sau
      }
    }

    console.log("📦 Final req.user:", decoded);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error("❌ Token error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
