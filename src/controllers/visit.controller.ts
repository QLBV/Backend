import { Request, Response } from "express";
import {
  checkInAppointmentService,
  startExaminationService,
  completeVisitService,
} from "../services/visit.service";
import { getDisplayStatus } from "../utils/statusMapper";
import * as auditLogService from "../services/auditLog.service";

export const checkInAppointment = async (req: Request, res: Response) => {
  try {
    const visit = await checkInAppointmentService(
      Number(req.params.appointmentId)
    );

    // Fetch the updated appointment to include in response
    const Appointment = (await import("../models/Appointment")).default;
    const appointment = await Appointment.findByPk(visit.appointmentId);

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // AUDIT LOG: Log visit creation (check-in)
    await auditLogService.logCreate(req, "visits", visit.id, {
      visitCode: visit.visitCode,
      appointmentId: visit.appointmentId,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      status: visit.status,
    }).catch(err => console.error("Failed to log check-in audit:", err));

    // AUDIT LOG: Log appointment status update
    await auditLogService.logUpdate(req, "appointments", appointment.id,
      { status: "WAITING" },
      { status: appointment.status }
    ).catch(err => console.error("Failed to log appointment update audit:", err));

    // Calculate displayStatus
    const displayStatus = getDisplayStatus(
      { status: appointment.status },
      { status: visit.status }
    );

    res.json({
      success: true,
      message: "Check-in successful",
      data: {
        visit,
        appointment: {
          ...appointment.toJSON(),
          displayStatus,
        },
      },
    });
  } catch (err: any) {
    // Handle specific error cases
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "APPOINTMENT_ALREADY_CHECKED_IN",
      });
    }

    // Handle custom error messages from service
    const errorMessage = err?.message || "INTERNAL_SERVER_ERROR";
    const statusCode =
      errorMessage === "APPOINTMENT_NOT_FOUND" ? 404 :
      errorMessage === "APPOINTMENT_NOT_WAITING" ? 400 :
      errorMessage === "APPOINTMENT_ALREADY_CHECKED_IN" ? 409 :
      500;

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const startExamination = async (req: Request, res: Response) => {
  try {
    const visit = await startExaminationService(Number(req.params.id));

    // Fetch the updated appointment to include in response
    const Appointment = (await import("../models/Appointment")).default;
    const appointment = await Appointment.findByPk(visit.appointmentId);

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // AUDIT LOG: Log appointment status update (CHECKED_IN -> IN_PROGRESS)
    await auditLogService.logUpdate(req, "appointments", appointment.id,
      { status: "CHECKED_IN" },
      { status: appointment.status }
    ).catch(err => console.error("Failed to log start examination audit:", err));

    // Calculate displayStatus
    const displayStatus = getDisplayStatus(
      { status: appointment.status },
      { status: visit.status }
    );

    res.json({
      success: true,
      message: "Examination started successfully",
      data: {
        visit,
        appointment: {
          ...appointment.toJSON(),
          displayStatus,
        },
      },
    });
  } catch (err: any) {
    const errorMessage = err?.message || "INTERNAL_SERVER_ERROR";
    const statusCode =
      errorMessage === "VISIT_NOT_FOUND" ? 404 :
      errorMessage === "APPOINTMENT_NOT_FOUND" ? 404 :
      errorMessage === "VISIT_NOT_IN_EXAMINING_STATUS" ? 400 :
      errorMessage === "APPOINTMENT_NOT_CHECKED_IN" ? 400 :
      500;

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const completeVisit = async (req: Request, res: Response) => {
  try {
    const { diagnosis, note, vitalSigns, examinationFee = 100000 } = req.body;
    const createdBy = req.user!.userId;

    // Validate examinationFee if provided
    const fee = parseFloat(examinationFee);
    if (fee <= 0) {
      return res.status(400).json({
        success: false,
        message: "examinationFee must be greater than 0",
      });
    }

    // Fetch old visit for audit trail BEFORE update
    const Visit = (await import("../models/Visit")).default;
    const oldVisit = await Visit.findByPk(Number(req.params.id));
    const oldData = oldVisit ? {
      diagnosis: oldVisit.diagnosis,
      note: oldVisit.note,
      vitalSigns: oldVisit.vitalSigns,
      status: oldVisit.status,
    } : null;

    const result = await completeVisitService(
      Number(req.params.id),
      diagnosis,
      fee,
      createdBy,
      note,
      vitalSigns
    );

    // Fetch the updated appointment to include displayStatus
    const Appointment = (await import("../models/Appointment")).default;
    const appointment = await Appointment.findByPk(result.visit.appointmentId);

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // CRITICAL AUDIT LOG: Log diagnosis update (medical record change)
    if (oldData) {
      await auditLogService.logUpdate(req, "visits", result.visit.id, oldData, {
        diagnosis: result.visit.diagnosis,
        note: result.visit.note,
        status: result.visit.status,
      }).catch(err => console.error("Failed to log visit completion audit:", err));
    }

    // AUDIT LOG: Log invoice creation
    if (result.invoice) {
      await auditLogService.logCreate(req, "invoices", result.invoice.id, {
        invoiceCode: result.invoice.invoiceCode,
        visitId: result.invoice.visitId,
        examinationFee: result.invoice.examinationFee,
        totalAmount: result.invoice.totalAmount,
      }).catch(err => console.error("Failed to log invoice creation audit:", err));
    }

    const displayStatus = getDisplayStatus(
      { status: appointment.status },
      { status: result.visit.status }
    );

    // Kiểm tra nếu có lỗi khi tạo invoice
    if (result.invoiceError) {
      return res.json({
        success: true,
        message: "Examination saved but invoice creation failed",
        data: {
          visit: result.visit,
          appointment: {
            ...appointment.toJSON(),
            displayStatus,
          },
        },
        warning: result.invoiceError,
      });
    }

    res.json({
      success: true,
      message: "Examination saved and invoice created",
      data: {
        visit: result.visit,
        invoice: result.invoice,
        appointment: {
          ...appointment.toJSON(),
          displayStatus,
        },
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
    const Appointment = (await import("../models/Appointment")).default;
    const Shift = (await import("../models/Shift")).default;
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
          required: false,
          include: [{
            model: User,
            as: "user",
            required: false,
            attributes: ["id", "fullName", "email", "avatar"]
          }],
        },
        {
          model: Doctor,
          as: "doctor",
          required: false,
          include: [{
            model: User,
            as: "user",
            required: false,
            attributes: ["id", "fullName", "email", "avatar"]
          }],
        },
        {
          model: Appointment,
          as: "appointment",
          required: false,
          include: [
            {
              model: Shift,
              as: "shift",
              required: false,
              attributes: ["id", "name", "startTime", "endTime"],
            },
          ],
        },
      ],
      order: [["checkInTime", "DESC"]],
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });

    // Serialize visits and add displayStatus to each
    const serializedVisits = visits.map(visit => {
      const json = visit.toJSON ? visit.toJSON() : visit;

      // Calculate displayStatus if appointment exists
      let displayStatus = null;
      if (json.appointment) {
        displayStatus = getDisplayStatus(
          { status: json.appointment.status },
          { status: json.status }
        );
      }

      return {
        ...json,
        displayStatus,
      };
    });

    return res.json({
      success: true,
      data: serializedVisits,
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
    const Appointment = (await import("../models/Appointment")).default;
    const Prescription = (await import("../models/Prescription")).default;
    const PrescriptionDetail = (await import("../models/PrescriptionDetail")).default;
    const Medicine = (await import("../models/Medicine")).default;
    const Specialty = (await import("../models/Specialty")).default;
    const Shift = (await import("../models/Shift")).default;
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
          include: [
            { model: User, as: "user", attributes: ["fullName", "email"] },
            { model: Specialty, as: "specialty", attributes: ["id", "name"] },
          ],
        },
        { model: Diagnosis, as: "diagnoses" },
        {
          model: Appointment,
          as: "appointment",
          required: false,
          include: [
            { model: Shift, as: "shift", attributes: ["id", "name", "startTime", "endTime"] },
          ],
        },
        {
          model: Prescription,
          as: "prescription",
          required: false,
          include: [
            {
              model: PrescriptionDetail,
              as: "details",
              include: [
                { model: Medicine, as: "Medicine", attributes: ["id", "name", "unit", "salePrice"] },
              ],
            },
          ],
        },
        {
          model: (await import("../models/Invoice")).default,
          as: "invoice",
          required: false,
          attributes: ["id", "paymentStatus", "totalAmount"]
        }
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

    // Calculate displayStatus
    const visitJson = visit.toJSON ? visit.toJSON() : visit;
    const displayStatus = visitJson.appointment
      ? getDisplayStatus(
          { status: visitJson.appointment.status },
          { status: visitJson.status }
        )
      : null;

    return res.json({
      success: true,
      data: {
        ...visitJson,
        displayStatus,
      },
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
    const Appointment = (await import("../models/Appointment")).default;
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
        {
          model: Appointment,
          as: "appointment",
          required: false,
        },
      ],
      order: [["checkInTime", "DESC"]],
    });

    // Add displayStatus to each visit
    const serializedVisits = visits.map(visit => {
      const json = visit.toJSON ? visit.toJSON() : visit;
      const displayStatus = json.appointment
        ? getDisplayStatus(
            { status: json.appointment.status },
            { status: json.status }
          )
        : null;

      return {
        ...json,
        displayStatus,
      };
    });

    return res.json({
      success: true,
      data: serializedVisits,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
