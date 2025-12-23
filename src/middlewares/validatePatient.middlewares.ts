// import { Response, NextFunction } from "express";
// import { AuthRequest } from "./auth.middlewares";
// import Patient from "../models/Patient";
// import { RoleCode } from "../constant/role";

// export const validatePatient = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { roleId, patientId } = req.user!;

//     let patientIdToCheck: number;

//     // 🔐 PATIENT: chỉ được thao tác patient của chính mình
//     if (roleId === RoleCode.PATIENT) {
//       if (!patientId) {
//         return res.status(400).json({
//           success: false,
//           message: "PATIENT_PROFILE_NOT_SETUP",
//         });
//       }
//       patientIdToCheck = patientId;
//     }
//     // 🛡️ ADMIN / DOCTOR / RECEPTIONIST
//     else {
//       patientIdToCheck = Number(req.params.id);
//       if (!patientIdToCheck) {
//         return res.status(400).json({
//           success: false,
//           message: "INVALID_PATIENT_ID",
//         });
//       }
//     }

//     // 🔎 Query patient
//     const patient = await Patient.findOne({
//       where: {
//         id: patientIdToCheck,
//         isActive: true,
//       },
//     });

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "PATIENT_NOT_FOUND",
//       });
//     }

//     // 📌 Gắn vào request cho controller dùng
//     req.patientData = patient;

//     next();
//   } catch (error: any) {
//     console.error("❌ validatePatient error:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "VALIDATE_PATIENT_FAILED",
//     });
//   }
// };
import { Request, Response, NextFunction } from "express";
import Patient from "../models/Patient";
import { RoleCode } from "../constant/role";

export const validatePatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roleId, patientId } = req.user!;

    let patientIdToCheck: number;

    if (roleId === RoleCode.PATIENT) {
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: "PATIENT_PROFILE_NOT_SETUP",
        });
      }
      patientIdToCheck = patientId;
    } else {
      patientIdToCheck = Number(req.params.id);
      if (!patientIdToCheck) {
        return res.status(400).json({
          success: false,
          message: "INVALID_PATIENT_ID",
        });
      }
    }

    const patient = await Patient.findOne({
      where: { id: patientIdToCheck, isActive: true },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "PATIENT_NOT_FOUND",
      });
    }

    req.patientData = patient;
    next();
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "VALIDATE_PATIENT_FAILED",
    });
  }
};
