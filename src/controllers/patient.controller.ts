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

const formatPatient = (patient: any) => {
  // Extract phone, email, address from profiles for easier access
  const profiles = patient.profiles ? patient.profiles.map(formatProfile) : [];
  const phoneProfile = profiles.find((p: any) => p.type === "phone");
  const emailProfile = profiles.find((p: any) => p.type === "email");
  const addressProfile = profiles.find((p: any) => p.type === "address");
  
  // Format address string from address profile
  let addressString = null;
  if (addressProfile) {
    const parts = [addressProfile.value];
    if (addressProfile.ward) parts.push(addressProfile.ward);
    if (addressProfile.city) parts.push(addressProfile.city);
    addressString = parts.join(", ");
  }
  
  return {
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
    // Extract common fields from profiles for easier access
    phone: phoneProfile?.value || null,
    email: emailProfile?.value || null,
    address: addressString,
    profiles,
    // Health information
    bloodType: patient.bloodType || null,
    height: patient.height ? parseFloat(patient.height.toString()) : null,
    weight: patient.weight ? parseFloat(patient.weight.toString()) : null,
    chronicDiseases: patient.chronicDiseases 
      ? (typeof patient.chronicDiseases === 'string' 
          ? JSON.parse(patient.chronicDiseases) 
          : Array.isArray(patient.chronicDiseases) 
            ? patient.chronicDiseases 
            : [])
      : [],
    allergies: patient.allergies 
      ? (typeof patient.allergies === 'string' 
          ? JSON.parse(patient.allergies) 
          : Array.isArray(patient.allergies) 
            ? patient.allergies 
            : [])
      : [],
    noShowCount: patient.noShowCount || 0,
    lastNoShowDate: patient.lastNoShowDate || null,
  };
};

/* ================= SETUP Patient Profile (NEW) ================= */

export const setupPatientProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fullName, gender, dateOfBirth, cccd, profiles } = req.body;

    // Log để debug
    console.log("📝 Setup patient profile request:", {
      userId,
      fullName,
      gender,
      dateOfBirth,
      cccd,
      profilesCount: profiles?.length || 0,
      profiles,
    });

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

    if (!patient) {
      console.error("❌ setupPatientProfileService returned null");
      return res.status(500).json({
        success: false,
        message: "Failed to setup patient profile",
      });
    }

    console.log("✅ Patient profile setup successfully:", {
      patientId: patient.id,
      patientCode: patient.patientCode,
      profilesCount: (patient as any).profiles?.length || 0,
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

    // Log incoming data for debugging
    console.log("📝 Update patient request:", {
      id,
      body: req.body,
      chronicDiseases: req.body.chronicDiseases,
      allergies: req.body.allergies,
    });

    const patient = await updatePatientService(id, req.body);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    console.log("✅ Patient updated successfully:", {
      id: patient.id,
      chronicDiseases: (patient as any).chronicDiseases,
      allergies: (patient as any).allergies,
    });

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

    console.error("❌ Update patient error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update patient",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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

/**
 * Get patient's complete medical history
 * GET /api/patients/:id/medical-history
 * Role: DOCTOR, ADMIN, PATIENT (own only)
 */
export const getPatientMedicalHistory = async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.id);
    const Visit = (await import("../models/Visit")).default;
    const Doctor = (await import("../models/Doctor")).default;
    const User = (await import("../models/User")).default;
    const Diagnosis = (await import("../models/Diagnosis")).default;
    const Prescription = (await import("../models/Prescription")).default;
    const { RoleCode } = await import("../constant/role");

    // Permission check
    const role = req.user!.roleId;
    if (role === RoleCode.PATIENT) {
      if (patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

    // Get all visits with related data
    const visits = await Visit.findAll({
      where: { patientId },
      include: [
        {
          model: Doctor,
          as: "doctor",
          include: [{ model: User, as: "user", attributes: ["fullName", "email"] }],
        },
        { model: Diagnosis, as: "diagnoses" },
      ],
      order: [["checkInTime", "DESC"]],
    });

    // Get all prescriptions
    const prescriptions = await Prescription.findAll({
      where: { patientId },
      include: [
        {
          model: Doctor,
          as: "Doctor",
          include: [{ model: User, as: "user", attributes: ["fullName"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: {
        visits,
        prescriptions,
        totalVisits: visits.length,
        totalPrescriptions: prescriptions.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get medical history",
    });
  }
};

/**
 * Get all patient's prescriptions
 * GET /api/patients/:id/prescriptions
 * Role: DOCTOR, ADMIN, PATIENT (own only)
 */
export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.id);
    const Prescription = (await import("../models/Prescription")).default;
    const PrescriptionDetail = (await import("../models/PrescriptionDetail")).default;
    const Doctor = (await import("../models/Doctor")).default;
    const User = (await import("../models/User")).default;
    const Visit = (await import("../models/Visit")).default;
    const { RoleCode } = await import("../constant/role");

    // Permission check
    const role = req.user!.roleId;
    if (role === RoleCode.PATIENT) {
      if (patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

    const prescriptions = await Prescription.findAll({
      where: { patientId },
      include: [
        {
          model: PrescriptionDetail,
          as: "details",
        },
        {
          model: Doctor,
          as: "Doctor",
          include: [{ model: User, as: "user", attributes: ["fullName", "email"] }],
        },
        { model: Visit },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: prescriptions,
      total: prescriptions.length,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get prescriptions",
    });
  }
};
