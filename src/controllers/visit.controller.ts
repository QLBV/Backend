import { Request, Response } from "express";
import {
  checkInAppointmentService,
  completeVisitService,
} from "../services/visit.service";

export const checkInAppointment = async (req: Request, res: Response) => {
  try {
    const visit = await checkInAppointmentService(
      Number(req.params.appointmentId)
    );

    res.json({
      success: true,
      message: "Check-in successful",
      data: visit,
    });
  } catch (err: any) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "APPOINTMENT_ALREADY_CHECKED_IN" });
    }
    throw err;
  }
};

export const completeVisit = async (req: Request, res: Response) => {
  try {
    const { diagnosis, note, examinationFee } = req.body;
    const createdBy = req.user!.userId;

    // Validate examinationFee
    if (!examinationFee || examinationFee <= 0) {
      return res.status(400).json({
        success: false,
        message: "examinationFee is required and must be greater than 0",
      });
    }

    const result = await completeVisitService(
      Number(req.params.id),
      diagnosis,
      parseFloat(examinationFee),
      createdBy,
      note
    );

    // Kiá»ƒm tra náº¿u cÃ³ lá»—i khi táº¡o invoice
    if (result.invoiceError) {
      return res.json({
        success: true,
        message: "Visit completed but invoice creation failed",
        data: result.visit,
        warning: result.invoiceError,
      });
    }

    res.json({
      success: true,
      message: "Visit completed and invoice created",
      data: {
        visit: result.visit,
        invoice: result.invoice,
      },
    });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getVisits = async (req: Request, res: Response) => {
  try {
    const Visit = (await import("../models/Visit")).default;
    const Patient = (await import("../models/Patient")).default;
    const Doctor = (await import("../models/Doctor")).default;
    const User = (await import("../models/User")).default;
    const { Op } = await import("sequelize");
    const { RoleCode } = await import("../constant/role");

    // Build filters
    const where: any = {};

    // Date range filter
    if (req.query.startDate) {
      where.checkInTime = { ...where.checkInTime, [Op.gte]: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate as string);
      endDate.setHours(23, 59, 59, 999);
      where.checkInTime = { ...where.checkInTime, [Op.lte]: endDate };
    }

    // Patient filter (for doctors and admins)
    if (req.query.patientId) {
      where.patientId = Number(req.query.patientId);
    }

    // Doctor filter
    if (req.query.doctorId) {
      where.doctorId = Number(req.query.doctorId);
    }

    // Role-based filtering
    const role = req.user!.roleId;
    if (role === RoleCode.PATIENT) {
      // Patients can only view their own visits
      if (!req.user!.patientId) {
        return res.status(400).json({
          success: false,
          message: "PATIENT_NOT_SETUP",
        });
      }
      where.patientId = req.user!.patientId;
    } else if (role === RoleCode.DOCTOR) {
      // Doctors can view their own patients' visits
      if (!req.user!.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }
      where.doctorId = req.user!.doctorId;
    }

    const visits = await Visit.findAll({
      where,
      include: [
        {
          model: Patient,
          as: "patient",
          include: [{ model: User, as: "user", attributes: ["fullName", "email"] }],
        },
        {
          model: Doctor,
          as: "doctor",
          include: [{ model: User, as: "user", attributes: ["fullName", "email"] }],
        },
      ],
      order: [["checkInTime", "DESC"]],
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });

    return res.json({
      success: true,
      data: visits,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getVisitById = async (req: Request, res: Response) => {
  try {
    const Visit = (await import("../models/Visit")).default;
    const Patient = (await import("../models/Patient")).default;
    const Doctor = (await import("../models/Doctor")).default;
    const User = (await import("../models/User")).default;
    const Diagnosis = (await import("../models/Diagnosis")).default;
    const { RoleCode } = await import("../constant/role");

    const visit = await Visit.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: "patient",
          include: [{ model: User, as: "user", attributes: ["fullName", "email", "avatar"] }],
        },
        {
          model: Doctor,
          as: "doctor",
          include: [{ model: User, as: "user", attributes: ["fullName", "email"] }],
        },
        { model: Diagnosis, as: "diagnoses" },
      ],
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "VISIT_NOT_FOUND",
      });
    }

    // Permission check
    const role = req.user!.roleId;
    if (role === RoleCode.PATIENT) {
      if (visit.patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    } else if (role === RoleCode.DOCTOR) {
      if (visit.doctorId !== req.user!.doctorId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

    return res.json({
      success: true,
      data: visit,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getPatientVisits = async (req: Request, res: Response) => {
  try {
    const Visit = (await import("../models/Visit")).default;
    const Doctor = (await import("../models/Doctor")).default;
    const User = (await import("../models/User")).default;
    const Diagnosis = (await import("../models/Diagnosis")).default;
    const { RoleCode } = await import("../constant/role");

    const patientId = Number(req.params.patientId);

    // Permission check - only allow doctors, admin, receptionist, or the patient themselves
    const role = req.user!.roleId;
    if (role === RoleCode.PATIENT) {
      if (patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

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

    return res.json({
      success: true,
      data: visits,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
