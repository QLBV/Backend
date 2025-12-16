import { Request, Response } from "express";
import {
  createPatientService,
  getPatientsService,
  getPatientByIdService,
  updatePatientService,
  deletePatientService,
} from "../services/patient";

export const createPatient = async (req: Request, res: Response) => {
  try {
    const patient = await createPatientService(req.body);

    return res.status(201).json({
      success: true,
      patient,
    });
  } catch (error: any) {
    console.error("Create patient error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Create patient failed",
    });
  }
};

export const getPatients = async (req: Request, res: Response) => {
  try {
    const patients = await getPatientsService();

    return res.json({
      success: true,
      patients,
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
      patient,
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

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const patient = await updatePatientService(id, req.body);

    return res.json({
      success: true,
      patient,
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
      message: "Update patient failed",
    });
  }
};

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
