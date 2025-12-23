// import { Request, Response } from "express";
// import {
//   createVisitService,
//   getVisitsByPatientService,
//   getVisitByIdService,
//   updateVisitService,
//   deleteVisitService,
// } from "../services/visit.service";

// const formatVisit = (visit: any) => ({
//   id: visit.id,
//   visitCode: visit.visitCode,
//   patientId: visit.patientId,
//   visitDate: visit.visitDate,
//   symptomInitial: visit.symptomInitial,
//   status: visit.status,
//   createdAt: visit.createdAt,
//   updatedAt: visit.updatedAt,
// });

// /* ================= CREATE - Visit ================= */

// export const createVisit = async (req: any, res: Response) => {
//   try {
//     console.log("👤 req.user:", req.user);

//     const patientId = req.user?.patientId;
//     const { visitDate, symptomInitial } = req.body;

//     console.log("📝 Data:", { patientId, visitDate, symptomInitial });

//     // Validate patientId
//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "PatientId not found in token",
//       });
//     }

//     // Validate required fields
//     if (!visitDate || !symptomInitial) {
//       return res.status(400).json({
//         success: false,
//         message: "Visit date and symptom are required",
//       });
//     }

//     // Validate symptom
//     if (
//       typeof symptomInitial !== "string" ||
//       symptomInitial.trim().length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Symptom must be a non-empty string",
//       });
//     }

//     const visit = await createVisitService(patientId, {
//       visitDate,
//       symptomInitial,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Visit created successfully",
//       data: formatVisit(visit),
//     });
//   } catch (error: any) {
//     console.error("❌ Error creating visit:", error.message);

//     const errorMessages: { [key: string]: string } = {
//       PATIENT_NOT_FOUND: "Patient not found or inactive",
//       PATIENT_NOT_SETUP: "Please complete patient profile setup first",
//       SYMPTOM_REQUIRED: "Symptom description is required",
//       VISIT_DATE_INVALID_FORMAT: "Invalid visit date format (use YYYY-MM-DD)",
//       VISIT_DATE_CANNOT_BE_PAST: "Visit date cannot be in the past",
//       VISIT_DATE_TOO_FAR:
//         "Visit date cannot be more than 90 days in the future",
//     };

//     const message = errorMessages[error.message] || error.message;
//     const statusCode = error.message === "PATIENT_NOT_FOUND" ? 404 : 400;

//     res.status(statusCode).json({
//       success: false,
//       message,
//     });
//   }
// };

// /* ================= READ ================= */

// export const getVisitsByPatient = async (req: any, res: Response) => {
//   try {
//     const patientId = req.user?.patientId;

//     if (!patientId) {
//       return res.status(400).json({
//         success: false,
//         message: "PatientId not found in token",
//       });
//     }

//     const visits = await getVisitsByPatientService(patientId);

//     res.json({
//       success: true,
//       count: visits.length,
//       data: visits.map(formatVisit),
//     });
//   } catch (error: any) {
//     console.error("Error getting visits:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to get visits",
//     });
//   }
// };

// export const getVisitById = async (req: any, res: Response) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid visit ID",
//       });
//     }

//     const visit = await getVisitByIdService(Number(id), req.user);

//     res.json({
//       success: true,
//       data: formatVisit(visit),
//     });
//   } catch (error: any) {
//     if (error.message === "VISIT_NOT_FOUND") {
//       return res.status(404).json({
//         success: false,
//         message: "Visit not found",
//       });
//     }
//     if (error.message === "FORBIDDEN") {
//       return res.status(403).json({
//         success: false,
//         message: "You are not allowed to access this visit",
//       });
//     }

//     console.error("Error getting visit:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to get visit",
//     });
//   }
// };

// /* ================= UPDATE ================= */

// export const updateVisit = async (req: any, res: Response) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid visit ID",
//       });
//     }

//     // Validate status if provided
//     if (
//       req.body.status &&
//       !["waiting", "examining", "done"].includes(req.body.status)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Status must be 'waiting', 'examining', or 'done'",
//       });
//     }

//     const visit = await updateVisitService(Number(id), req.body, req.user);

//     res.json({
//       success: true,
//       message: "Visit updated successfully",
//       data: formatVisit(visit),
//     });
//   } catch (error: any) {
//     if (error.message === "VISIT_NOT_FOUND") {
//       return res.status(404).json({
//         success: false,
//         message: "Visit not found",
//       });
//     }

//     if (error.message === "INVALID_STATUS") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status value",
//       });
//     }

//     console.error("Error updating visit:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update visit",
//     });
//   }
// };

// /* ================= DELETE ================= */

// export const deleteVisit = async (req: any, res: Response) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid visit ID",
//       });
//     }

//     await deleteVisitService(Number(id), req.user);

//     res.json({
//       success: true,
//       message: "Visit deleted successfully",
//     });
//   } catch (error: any) {
//     if (error.message === "VISIT_NOT_FOUND") {
//       return res.status(404).json({
//         success: false,
//         message: "Visit not found",
//       });
//     }

//     if (error.message === "VISIT_CANNOT_DELETE") {
//       return res.status(400).json({
//         success: false,
//         message: "Can only delete visits with 'waiting' status",
//       });
//     }

//     console.error("Error deleting visit:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete visit",
//     });
//   }
// };
// controllers/appointment.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middlewares";
import { createAppointmentService } from "../services/appointment.service";

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId, shiftId, date, bookingType, symptomInitial } = req.body;

    const bookedBy = req.user?.role === "PATIENT" ? "PATIENT" : "RECEPTIONIST";

    const appointment = await createAppointmentService({
      patientId: req.user!.patientId,
      doctorId,
      shiftId,
      date,
      bookingType,
      bookedBy,
      symptomInitial,
    });

    res.json({
      success: true,
      message: "Appointment created",
      data: appointment,
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};
