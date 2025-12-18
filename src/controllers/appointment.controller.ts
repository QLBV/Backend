import { Request, Response } from "express";
import { createVisitService } from "../services/visit.service";

export const createVisit = async (req: any, res: Response) => {
  try {
    console.log("👤 req.user:", req.user); // ← Debug: xem user data

    const patientId = req.user.patientId;
    const { visitDate, symptomInitial } = req.body;

    console.log("📝 Data:", { patientId, visitDate, symptomInitial });

    if (!patientId) {
      // ← Kiểm tra patientId
      return res.status(400).json({
        success: false,
        message: "PatientId not found in token",
      });
    }

    if (!visitDate || !symptomInitial) {
      return res.status(400).json({
        success: false,
        message: "Visit date and symptom are required",
      });
    }

    const visit = await createVisitService(patientId, {
      visitDate,
      symptomInitial,
    });

    res.status(201).json({
      success: true,
      data: visit,
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message || "Create visit failed",
    });
  }
};
