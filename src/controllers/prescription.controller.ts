import { Request, Response } from "express";
import {
  createPrescriptionService,
  updatePrescriptionService,
  cancelPrescriptionService,
  getPrescriptionByIdService,
  getPrescriptionsByPatientService,
  getPrescriptionByVisitService,
  getPrescriptionsService,
} from "../services/prescription.service";
import { generatePrescriptionPDF } from "../utils/pdfGenerator";
import Prescription, { PrescriptionStatus } from "../models/Prescription";
import PrescriptionDetail from "../models/PrescriptionDetail";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import Visit from "../models/Visit";
import DiseaseCategory from "../models/DiseaseCategory";
import User from "../models/User";
import PatientProfile from "../models/PatientProfile";
import Specialty from "../models/Specialty";
import { RoleCode } from "../constant/role";

/**
 * Create a new prescription
 * POST /api/prescriptions
 * Role: DOCTOR
 */
export const createPrescription = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { visitId, patientId, medicines, note } = req.body;

    const prescription = await createPrescriptionService(doctorId, patientId, {
      visitId,
      medicines,
      note,
    });

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to create prescription";

    // Handle specific errors
    if (errorMessage.includes("INSUFFICIENT_STOCK")) {
      return res.status(400).json({
        success: false,
        message: "Insufficient medicine stock",
        error: errorMessage,
      });
    }

    if (errorMessage === "PRESCRIPTION_ALREADY_EXISTS") {
      return res.status(400).json({
        success: false,
        message: "Prescription already exists for this visit",
      });
    }

    if (errorMessage === "VISIT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Visit not found",
      });
    }

    if (errorMessage === "UNAUTHORIZED_VISIT") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create prescription for this visit",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Update prescription (only if DRAFT)
 * PUT /api/prescriptions/:id
 * Role: DOCTOR
 */
export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { id } = req.params;
    const { medicines, note } = req.body;

    const prescription = await updatePrescriptionService(Number(id), doctorId, {
      medicines,
      note,
    });

    return res.json({
      success: true,
      message: "Prescription updated successfully",
      data: prescription,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to update prescription";

    if (errorMessage === "PRESCRIPTION_LOCKED_CANNOT_EDIT") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot edit prescription after payment. Prescription is locked.",
      });
    }

    if (errorMessage === "PRESCRIPTION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    if (errorMessage === "UNAUTHORIZED_PRESCRIPTION") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this prescription",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Cancel prescription and restore stock
 * POST /api/prescriptions/:id/cancel
 * Role: DOCTOR
 */
export const cancelPrescription = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const { id } = req.params;

    const prescription = await cancelPrescriptionService(Number(id), doctorId);

    return res.json({
      success: true,
      message: "Prescription cancelled successfully",
      data: prescription,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to cancel prescription";

    if (errorMessage === "PRESCRIPTION_LOCKED_CANNOT_CANCEL") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot cancel prescription after payment. Prescription is locked.",
      });
    }

    if (errorMessage === "PRESCRIPTION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Get all prescriptions with pagination and filtering
 * GET /api/prescriptions
 * Role: DOCTOR (own only), ADMIN (all)
 */
export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, patientId } = req.query;
    const userRole = req.user!.roleId;
    const userId = req.user!.userId;

    // Build query parameters
    const params: any = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      patientId: patientId ? parseInt(patientId as string) : undefined,
    };

    // If user is a doctor, only show their own prescriptions
    if (userRole === RoleCode.DOCTOR) {
      // Find the doctor record to get doctorId
      const doctor = await Doctor.findOne({ where: { userId } });
      if (doctor) {
        params.doctorId = doctor.id;
      }
    }

    const result = await getPrescriptionsService(params);

    return res.json({
      success: true,
      data: result.prescriptions,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get prescriptions",
    });
  }
};

/**
 * Get prescription by ID
 * GET /api/prescriptions/:id
 * Role: DOCTOR, PATIENT (own only)
 */
export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await getPrescriptionByIdService(Number(id));

    return res.json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to get prescription";

    if (errorMessage === "PRESCRIPTION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Get prescriptions by patient
 * GET /api/prescriptions/patient/:patientId
 * Role: DOCTOR, PATIENT (own only)
 */
export const getPrescriptionsByPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await getPrescriptionsByPatientService(
      Number(patientId)
    );

    return res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get prescriptions",
    });
  }
};

/**
 * Get prescription by visit
 * GET /api/prescriptions/visit/:visitId
 * Role: DOCTOR
 */
export const getPrescriptionByVisit = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;

    const prescription = await getPrescriptionByVisitService(Number(visitId));

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "No prescription found for this visit",
      });
    }

    return res.json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get prescription",
    });
  }
};

/**
 * Dispense prescription (mark as dispensed)
 * PUT /api/prescriptions/:id/dispense
 * Role: RECEPTIONIST, ADMIN
 */
export const dispensePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dispensedBy } = req.body;

    const prescription = await Prescription.findByPk(Number(id));

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "PRESCRIPTION_NOT_FOUND",
      });
    }

    if (prescription.status === PrescriptionStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: "CANNOT_DISPENSE_CANCELLED_PRESCRIPTION",
      });
    }

    if (prescription.status === PrescriptionStatus.DISPENSED) {
      return res.status(400).json({
        success: false,
        message: "PRESCRIPTION_ALREADY_DISPENSED",
      });
    }

    // Update prescription status
    prescription.status = PrescriptionStatus.DISPENSED;
    prescription.dispensedAt = new Date();
    prescription.dispensedBy = dispensedBy || req.user!.userId;
    await prescription.save();

    return res.json({
      success: true,
      message: "Prescription dispensed successfully",
      data: prescription,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to dispense prescription",
    });
  }
};

/**
 * Export prescription as PDF
 * GET /api/prescriptions/:id/pdf
 * Role: DOCTOR, PATIENT (own only)
 */
export const exportPrescriptionPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch prescription with all related data
    const prescription = await Prescription.findByPk(Number(id), {
      include: [
        {
          model: PrescriptionDetail,
          as: "details",
        },
        {
          model: Patient,
          include: [
            {
              model: User,
              as: "user",
            },
            {
              model: PatientProfile,
              as: "profile",
            },
          ],
        },
        {
          model: Doctor,
          as: "Doctor",
          include: [
            {
              model: User,
              as: "user",
            },
            {
              model: Specialty,
              as: "specialty",
            },
          ],
        },
        {
          model: Visit,
          include: [
            {
              model: DiseaseCategory,
            },
          ],
        },
      ],
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Prepare data for PDF
    const patient = prescription.get("Patient") as any;
    const doctor = prescription.get("Doctor") as any;
    const visit = prescription.get("Visit") as any;
    const details = prescription.get("details") as any[];

    const pdfData = {
      prescriptionCode: prescription.prescriptionCode,
      patientName: patient?.user?.fullName || "N/A",
      patientPhone: undefined, // Phone number not available in User model
      patientAge: patient?.profile?.dateOfBirth
        ? new Date().getFullYear() -
          new Date(patient.profile.dateOfBirth).getFullYear()
        : undefined,
      doctorName: doctor?.user?.fullName || "N/A",
      doctorSpecialty: doctor?.specialty?.name || "N/A",
      visitDate: visit?.checkInTime || prescription.createdAt,
      diagnosis: visit?.diagnosis,
      symptoms: visit?.symptoms,
      diseaseCategory: visit?.DiseaseCategory?.name,
      medicines:
        details?.map((detail: any) => ({
          medicineName: detail.medicineName,
          quantity: detail.quantity,
          unit: detail.unit,
          unitPrice: parseFloat(detail.unitPrice),
          dosageMorning: parseFloat(detail.dosageMorning),
          dosageNoon: parseFloat(detail.dosageNoon),
          dosageAfternoon: parseFloat(detail.dosageAfternoon),
          dosageEvening: parseFloat(detail.dosageEvening),
          instruction: detail.instruction,
        })) || [],
      totalAmount: parseFloat(prescription.totalAmount.toString()),
      note: prescription.note,
      createdAt: prescription.createdAt,
    };

    // Generate PDF (without digital signature for now - would need doctor's private key)
    const pdfBuffer = await generatePrescriptionPDF(pdfData);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Prescription_${prescription.prescriptionCode}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Error generating prescription PDF:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate prescription PDF",
    });
  }
};
