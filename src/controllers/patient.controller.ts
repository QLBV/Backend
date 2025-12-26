import { Request, Response } from "express";
import {
  setupPatientProfileService,
  getPatientsService,
  getPatientByIdService,
  getPatientByCccdService,
  updatePatientService,
  deletePatientService,
} from "../services/patient.service";
import { Patient } from "../models";

const formatProfile = (p: any) => {
  if (p.type === "address") {
    return {
      type: p.type,
      value: p.value,
      city: p.city,
      ward: p.ward,
    };
  }

  return {
    type: p.type,
    value: p.value,
  };
};

const formatPatient = (patient: any) => ({
  id: patient.id,
  patientCode: patient.patientCode,
  fullName: patient.fullName,
  dateOfBirth: patient.dateOfBirth,
  gender: patient.gender,
  cccd: patient.cccd,
  avatar: patient.avatar,
  userId: patient.userId,
  isActive: patient.isActive,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
  profiles: patient.profiles ? patient.profiles.map(formatProfile) : [],
});

/* ================= SETUP Patient Profile (NEW) ================= */

export const setupPatientProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fullName, gender, dateOfBirth, cccd, profiles } = req.body;

    // Validate required fields
    if (!fullName || !gender || !dateOfBirth || !cccd) {
      return res.status(400).json({
        success: false,
        message: "fullName, gender, dateOfBirth, and CCCD are required",
      });
    }

    // Validate gender
    if (!["MALE", "FEMALE", "OTHER"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be 'MALE', 'FEMALE', or 'OTHER'",
      });
    }

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Profiles must be a non-empty array",
      });
    }

    // Validate each profile
    for (const profile of profiles) {
      if (!profile.type || !profile.value) {
        return res.status(400).json({
          success: false,
          message: "Each profile must have 'type' and 'value'",
        });
      }

      if (!["phone", "email", "address"].includes(profile.type)) {
        return res.status(400).json({
          success: false,
          message: "Profile type must be 'phone', 'email', or 'address'",
        });
      }

      // Validate email format
      if (profile.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.value.trim())) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          });
        }
      }

      // Validate phone format (Vietnamese)
      if (profile.type === "phone") {
        const phoneRegex = /^(?:\+84|0)[1-9]\d{8,9}$/;
        const cleanPhone = profile.value.replace(/\s/g, "");
        if (!phoneRegex.test(cleanPhone)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Vietnamese phone number",
          });
        }
      }

      // Validate address
      if (profile.type === "address") {
        if (!profile.value.trim()) {
          return res.status(400).json({
            success: false,
            message: "Address value cannot be empty",
          });
        }
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const patient = await setupPatientProfileService(userId, {
      fullName,
      gender,
      dateOfBirth,
      cccd,
      profiles,
    });

    res.status(201).json({
      success: true,
      message: "Patient profile setup successfully",
      data: formatPatient(patient),
    });
  } catch (error: any) {
    console.error("❌ Error setting up patient profile:", error.message);

    const errorMessages: { [key: string]: string } = {
      PATIENT_ALREADY_SETUP:
        "Patient profile already setup. Cannot setup again.",
      CCCD_ALREADY_EXISTS: "This CCCD is already registered",
      CCCD_INVALID_FORMAT: "CCCD must be exactly 12 digits",
      DOB_INVALID_FORMAT: "Invalid date of birth format",
      DOB_CANNOT_BE_FUTURE: "Date of birth cannot be in the future",
    };

    const message = errorMessages[error.message] || error.message;

    res.status(400).json({
      success: false,
      message,
    });
  }
};

/* ================= READ ================= */

export const getPatients = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const cccd = req.query.cccd as string | undefined;

    const patients = await getPatientsService(page, limit, cccd);

    // Check if searching by CCCD but no results found
    if (cccd && patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy bệnh nhân với CCCD: ${cccd}`,
      });
    }

    return res.json({
      success: true,
      page,
      limit,
      ...(cccd && { cccd }), // Include cccd in response if provided
      patients: patients.map(formatPatient),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get patients",
    });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const patient = await getPatientByIdService(id);

    return res.json({
      success: true,
      patient: formatPatient(patient),
    });
  } catch (error: any) {
    if (error.message === "PATIENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get patient",
    });
  }
};

/* ================= UPDATE ================= */

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const patient = await updatePatientService(id, req.body);

    return res.json({
      success: true,
      message: "Patient updated successfully",
      patient: formatPatient(patient),
    });
  } catch (error: any) {
    if (error.message === "PATIENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    console.error("Update patient error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
};

export const uploadPatientAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const avatarPath = `/uploads/patients/${req.file.filename}`;

    await patient.update({ avatar: avatarPath });

    return res.json({
      success: true,
      message: "Patient avatar uploaded successfully",
      data: {
        avatar: avatarPath,
      },
    });
  } catch (error) {
    console.error("Upload patient avatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
    });
  }
};

/* ================= DELETE (SOFT) ================= */

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    await deletePatientService(id);

    return res.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "PATIENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete patient",
    });
  }
};
