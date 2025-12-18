import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middlewares";
import Patient from "../models/Patient";

export const validatePatient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role, id: userId, patientId } = req.user!;

    let patientIdToCheck: number | null = null;

    // 🔐 PATIENT: chỉ được thao tác patient của mình
    if (role === "PATIENT") {
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: "Patient ID not found in token",
        });
      }
      patientIdToCheck = patientId;
    }
    // 🛡️ ADMIN / RECEPTIONIST / DOCTOR
    else {
      patientIdToCheck = Number(req.params.id);
      if (!patientIdToCheck) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient id",
        });
      }
    }

    // 🔎 Query patient
    const patient = await Patient.findOne({
      where: {
        id: patientIdToCheck,
        isActive: true,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or inactive",
      });
    }

    // Gắn vào request để controller dùng
    (req as any).patientData = patient;

    next();
  } catch (error: any) {
    console.error("❌ Patient validation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error validating patient",
    });
  }
};
