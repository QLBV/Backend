import { Request, Response } from "express";
import {
  createPrescriptionService,
  updatePrescriptionService,
  cancelPrescriptionService,
  getPrescriptionByIdService,
  getPrescriptionsByPatientService,
  getPrescriptionByVisitService,
  getPrescriptionsService,
  lockPrescriptionService,
} from "./prescription.service";
import { getInvoiceByIdService } from "../finance/invoice.service";
import { generatePrescriptionPDF } from "../../utils/pdfGenerator";
import Prescription, { PrescriptionStatus } from "../../models/Prescription";
import PrescriptionDetail from "../../models/PrescriptionDetail";
import Patient from "../../models/Patient";
import Doctor from "../../models/Doctor";
import Visit from "../../models/Visit";
import DiseaseCategory from "../../models/DiseaseCategory";
import User from "../../models/User";
import PatientProfile from "../../models/PatientProfile";
import Specialty from "../../models/Specialty";
import Appointment from "../../models/Appointment";
import { RoleCode } from "../../constant/role";
import * as auditLogService from "../admin/auditLog.service";


export const createPrescription = async (req: Request, res: Response) => {
  try {
    const doctorId = (req.user as any).doctorId || req.user!.userId;
    const { visitId, patientId, medicines, note } = req.body;

    const prescription = await createPrescriptionService(doctorId, patientId, {
      visitId,
      medicines,
      note,
    });

    
    await auditLogService.logCreate(req, "prescriptions", prescription.id, {
      prescriptionCode: prescription.prescriptionCode,
      visitId: prescription.visitId,
      doctorId: prescription.doctorId,
      patientId: prescription.patientId,
      totalAmount: prescription.totalAmount,
      status: prescription.status,
      medicineCount: medicines?.length || 0,
    }).catch(err => console.error("Failed to log prescription creation audit:", err));

    
    const Invoice = require( "../../models/Invoice").default;
    const invoiceRecord = await Invoice.findOne({
      where: { visitId },
      attributes: ["id"],
    });

    const invoice = invoiceRecord
      ? await getInvoiceByIdService(invoiceRecord.id)
      : null;

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully. Invoice has been generated.",
      data: {
        prescription,
        invoice: invoice || null,
      },
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to create prescription";

    
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

    if (errorMessage === "APPOINTMENT_NOT_IN_PROGRESS") {
      return res.status(400).json({
        success: false,
        message: "Appointment must be in progress before creating prescription",
      });
    }

    if (errorMessage === "APPOINTMENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
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


export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const doctorId = (req.user as any).doctorId || req.user!.userId;
    const { id } = req.params;
    const { medicines, note } = req.body;

    
    const oldPrescription = await Prescription.findByPk(Number(id));
    const oldData = oldPrescription ? {
      totalAmount: oldPrescription.totalAmount,
      note: oldPrescription.note,
      status: oldPrescription.status,
    } : null;

    const prescription = await updatePrescriptionService(Number(id), doctorId, {
      medicines,
      note,
    });

    
    if (oldData) {
      await auditLogService.logUpdate(req, "prescriptions", prescription.id, oldData, {
        totalAmount: prescription.totalAmount,
        note: prescription.note,
        status: prescription.status,
        medicineCount: medicines?.length || 0,
      }).catch(err => console.error("Failed to log prescription update audit:", err));
    }

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


export const cancelPrescription = async (req: Request, res: Response) => {
  try {
    const doctorId = (req.user as any).doctorId || req.user!.userId;
    const { id } = req.params;

    const prescription = await cancelPrescriptionService(Number(id), doctorId);

    
    await auditLogService.logUpdate(req, "prescriptions", prescription.id,
      { status: "DRAFT" },
      { status: prescription.status, cancelledBy: req.user!.userId }
    ).catch(err => console.error("Failed to log prescription cancellation audit:", err));

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


export const lockPrescription = async (req: Request, res: Response) => {
  try {
    const doctorId = (req.user as any).doctorId || req.user!.userId;
    const { id } = req.params;

    
    const existingPrescription = await Prescription.findByPk(Number(id));
    if (!existingPrescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    if (existingPrescription.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to lock this prescription",
      });
    }

    const result = await lockPrescriptionService(Number(id));

    
    await auditLogService.logUpdate(req, "prescriptions", result.prescription.id,
      { status: "DRAFT" },
      { status: result.prescription.status, lockedBy: req.user!.userId }
    ).catch(err => console.error("Failed to log prescription lock audit:", err));

    return res.json({
      success: true,
      message: "Prescription locked successfully. Invoice has been created.",
      data: {
        prescription: result.prescription,
        invoice: result.invoice,
      },
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to lock prescription";

    if (errorMessage === "PRESCRIPTION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    if (errorMessage === "PRESCRIPTION_ALREADY_LOCKED") {
      return res.status(400).json({
        success: false,
        message: "Prescription is already locked",
      });
    }

    if (errorMessage === "PRESCRIPTION_CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot lock a cancelled prescription",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};


export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, patientId } = req.query;
    const userRole = req.user!.roleId;
    const userId = req.user!.userId;

    
    const params: any = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      patientId: patientId ? parseInt(patientId as string) : undefined,
    };

    
    if (userRole === RoleCode.DOCTOR) {
      
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

    
    const oldStatus = prescription.status;
    prescription.status = PrescriptionStatus.DISPENSED;
    prescription.dispensedAt = new Date();
    prescription.dispensedBy = dispensedBy || req.user!.userId;
    await prescription.save();

    
    await auditLogService.logUpdate(req, "prescriptions", prescription.id,
      { status: oldStatus },
      {
        status: prescription.status,
        dispensedAt: prescription.dispensedAt,
        dispensedBy: prescription.dispensedBy,
      }
    ).catch(err => console.error("Failed to log prescription dispense audit:", err));

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


export const exportPrescriptionPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    
    const prescription = await Prescription.findByPk(Number(id), {
      include: [
        {
          model: PrescriptionDetail,
          as: "details",
        },
        {
          model: Patient,
          as: "patient",
          include: [
            {
              model: User,
              as: "user",
            },
            {
              model: PatientProfile,
              as: "profiles",
            },
          ],
        },
        {
          model: Doctor,
          as: "doctor",
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
          as: "visit",
          include: [
            {
              model: DiseaseCategory,
            },
            {
              model: Appointment,
              as: "appointment",
              required: false,
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

    
    const patient = prescription.get("patient") as any;
    const doctor = prescription.get("doctor") as any;
    const visit = prescription.get("visit") as any;
    const details = prescription.get("details") as any[];

    const profiles = patient?.profiles || [];
    const phoneProfile = profiles.find((p: any) => p.type === "phone");
    const addressProfile = profiles.find((p: any) => p.type === "address");

    const pdfData = {
      prescriptionCode: prescription.prescriptionCode,
      patientName: visit?.appointment?.patientName || patient?.fullName || patient?.user?.fullName || "N/A",
      patientPhone: visit?.appointment?.patientPhone || phoneProfile?.value || "N/A",
      patientAddress: addressProfile?.value || "N/A",
      patientGender: visit?.appointment?.patientGender || patient?.gender,
      patientAge: (visit?.appointment?.patientDob || patient?.dateOfBirth)
        ? new Date().getFullYear() - new Date(visit?.appointment?.patientDob || patient.dateOfBirth).getFullYear()
        : undefined,
      doctorName: doctor?.user?.fullName || "N/A",
      doctorSpecialty: doctor?.specialty?.name || doctor?.specialty || "N/A",
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

    
    const pdfBuffer = await generatePrescriptionPDF(pdfData);

    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Prescription_${prescription.prescriptionCode}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Error generating prescription PDF:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate prescription PDF",
    });
  }
};
