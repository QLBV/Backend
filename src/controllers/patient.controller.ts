import { Request, Response } from "express";
import {
  createPatientIdentityService,
  updatePatientProfileService,
  getPatientsService,
  getPatientByIdService,
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
  profiles: patient.profiles.map(formatProfile),
});

/* ================= BƯỚC 2: CREATE - Patient Identity ================= */

export const createPatientIdentity = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fullName, gender, dateOfBirth, cccd } = req.body;

    if (!fullName || !gender || !dateOfBirth || !cccd) {
      return res.status(400).json({
        success: false,
        message: "fullName, gender, dateOfBirth, and CCCD are required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const patient = await createPatientIdentityService(userId, {
      fullName,
      gender,
      dateOfBirth,
      cccd,
    });

    res.status(201).json({
      success: true,
      data: patient,
      message: "Patient identity created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating patient identity:", error.message);

    if (error.message === "PATIENT_ALREADY_EXISTS") {
      return res.status(400).json({
        success: false,
        message: "Patient already exists for this user",
      });
    }

    if (error.message === "CCCD_ALREADY_EXISTS") {
      return res.status(400).json({
        success: false,
        message: "This CCCD is already registered",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create patient identity",
    });
  }
};

/* ================= BƯỚC 3: UPDATE - Patient Profiles ================= */

export const updatePatientProfile = async (req: any, res: Response) => {
  try {
    const patientId = Number(req.params.id);
    const { profiles } = req.body;

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Profiles must be a non-empty array",
      });
    }

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
    }

    const result = await updatePatientProfileService(patientId, profiles);
    res.status(200).json({
      success: true,
      data: formatProfile(result),
      message: "Patient profiles updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating profiles:", error.message);

    if (error.message === "PATIENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profiles",
    });
  }
};

/* ================= READ ================= */

export const getPatients = async (req: Request, res: Response) => {
  try {
    const patients = await getPatientsService();

    return res.json({
      success: true,
      patients: patients.map(formatPatient),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Get patients failed",
    });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
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
      message: "Get patient failed",
    });
  }
};

/* ================= UPDATE ================= */

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const patient = await updatePatientService(id, req.body);

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

    console.error("Update patient error:", error);
    return res.status(500).json({
      success: false,
      message: "Update patient failed",
    });
  }
};

export const uploadPatientAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const avatarPath = `/uploads/patients/${req.file.filename}`;

    await patient.update({ avatar: avatarPath });

    return res.json({
      success: true,
      message: "Patient avatar uploaded successfully",
      avatar: avatarPath,
    });
  } catch (error) {
    console.error("Upload patient avatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload avatar failed",
    });
  }
};

/* ================= DELETE (SOFT) ================= */

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deletePatientService(id);

    return res.json({
      success: true,
      message: "Patient deleted",
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
      message: "Delete patient failed",
    });
  }
};
