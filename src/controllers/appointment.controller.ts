import { Request, Response } from "express";
import { createAppointmentService } from "../services/appointment.service";
import { RoleCode } from "../constant/role";
import { cancelAppointmentService } from "../services/appointmentCancel.service";
import { getAppointmentsService } from "../services/appointmentQuery.service";
import {
  notifyAppointmentCreated,
  notifyAppointmentCancelled,
} from "../events/appointmentEvents";

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { doctorId, shiftId, date, symptomInitial } = req.body;

    if (!doctorId || !shiftId || !date) {
      return res.status(400).json({ success: false, message: "MISSING_INPUT" });
    }

    const role = req.user!.roleId;

    const isPatient = role === RoleCode.PATIENT;
    const isReceptionist = role === RoleCode.RECEPTIONIST;

    if (!isPatient && !isReceptionist) {
      return res.status(403).json({ success: false, message: "FORBIDDEN" });
    }

    // set cứng, KHÔNG nhận bookingType từ body
    const bookedBy = isPatient ? "PATIENT" : "RECEPTIONIST";
    const bookingType = isPatient ? "ONLINE" : "OFFLINE";

    // patient online lấy từ token; offline lấy từ body
    const patientId = isPatient
      ? req.user!.patientId
      : Number(req.body.patientId);

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: isPatient ? "PATIENT_NOT_SETUP" : "MISSING_PATIENT_ID",
      });
    }

    const appointment = await createAppointmentService({
      patientId: Number(patientId),
      doctorId: Number(doctorId),
      shiftId: Number(shiftId),
      date: String(date),
      bookingType,
      bookedBy,
      symptomInitial,
    });

    //  Emit event để gửi notification
    notifyAppointmentCreated(appointment.id);

    return res.json({
      success: true,
      message: "APPOINTMENT_CREATED",
      data: appointment,
    });
    
  } catch (e: any) {
    const map: Record<string, string> = {
      DOCTOR_NOT_ON_DUTY: "Bác sĩ không trực ca này",
      SHIFT_FULL: "Ca khám đã đủ lượt",
      DAY_FULL: "Bác sĩ đã đủ 40 lịch trong ngày",
    };

    return res.status(400).json({
      success: false,
      message: map[e.message] || e.message,
    });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const role = req.user!.roleId;

    const result = await cancelAppointmentService({
      appointmentId: id,
      requesterRole: role,
      requesterPatientId: req.user?.patientId ?? null,
    });

    //  Emit event để gửi notification hủy lịch
    notifyAppointmentCancelled(id, "Bệnh nhân hủy lịch");

    return res.json({
      success: true,
      message: "APPOINTMENT_CANCELLED",
      data: result,
    });
  } catch (e: any) {
    const map: Record<string, string> = {
      APPOINTMENT_NOT_FOUND: "Không tìm thấy lịch hẹn",
      APPOINTMENT_NOT_WAITING: "Chỉ được hủy khi lịch đang đợi",
      CANCEL_TOO_LATE: "Chỉ được hủy trước giờ khám ít nhất 2 tiếng",
      FORBIDDEN: "Bạn không có quyền hủy lịch này",
    };
    return res
      .status(400)
      .json({ success: false, message: map[e.message] || e.message });
  }
};

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? String(req.query.date) : undefined;
    const doctorId = req.query.doctorId
      ? Number(req.query.doctorId)
      : undefined;
    const shiftId = req.query.shiftId ? Number(req.query.shiftId) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    // Nếu là PATIENT, chỉ cho xem lịch của chính mình
    let patientIdFilter: number | undefined = undefined;
    if (req.user?.roleId === RoleCode.PATIENT) {
      if (!req.user.patientId) {
        return res.status(400).json({
          success: false,
          message: "PATIENT_NOT_SETUP",
        });
      }
      patientIdFilter = req.user.patientId;
    }

    const data = await getAppointmentsService({
      date,
      doctorId,
      shiftId,
      status,
      patientId: patientIdFilter,
    });

    // Debug: Log first appointment structure
    if (data.length > 0) {
      const first = data[0];
      console.log("🔍 Controller - First appointment:", {
        id: first.id,
        doctorId: first.doctorId,
        hasDoctor: !!first.doctor,
        doctorUserId: (first as any).doctor?.userId,
        hasDoctorUser: !!(first as any).doctor?.user,
        doctorUserName: (first as any).doctor?.user?.fullName,
      });
    }

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const Appointment = (await import("../models/Appointment")).default;
    const Patient = (await import("../models/Patient")).default;
    const Doctor = (await import("../models/Doctor")).default;
    const Shift = (await import("../models/Shift")).default;
    const User = (await import("../models/User")).default;

    const appointment = await Appointment.findByPk(id, {
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
        { model: Shift, as: "shift" },
      ],
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "APPOINTMENT_NOT_FOUND",
      });
    }

    // Check permission: patient can only view their own, doctor can view theirs, admin/receptionist can view all
    // Normalize roleId to handle string/number type mismatch
    const roleId = req.user!.roleId;
    const normalizedRole = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;
    
    // Admin and Receptionist can view all appointments
    const isAdmin = normalizedRole === RoleCode.ADMIN;
    const isReceptionist = normalizedRole === RoleCode.RECEPTIONIST;
    
    if (isAdmin || isReceptionist) {
      return res.json({ success: true, data: appointment });
    }
    
    // Patient can only view their own appointments
    if (normalizedRole === RoleCode.PATIENT) {
      if (appointment.patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    } 
    // Doctor can only view their assigned appointments
    else if (normalizedRole === RoleCode.DOCTOR) {
      if (appointment.doctorId !== req.user!.doctorId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

    return res.json({ success: true, data: appointment });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { doctorId, shiftId, date, symptomInitial } = req.body;

    const Appointment = (await import("../models/Appointment")).default;
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "APPOINTMENT_NOT_FOUND",
      });
    }

    // Only allow update if status is WAITING
    if (appointment.status !== "WAITING") {
      return res.status(400).json({
        success: false,
        message: "CAN_ONLY_UPDATE_WAITING_APPOINTMENTS",
      });
    }

    // Check permission
    const role = req.user!.roleId;
    if (role === RoleCode.PATIENT) {
      if (appointment.patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

    // Update fields
    if (doctorId !== undefined) appointment.doctorId = Number(doctorId);
    if (shiftId !== undefined) appointment.shiftId = Number(shiftId);
    if (date !== undefined) appointment.date = new Date(date);
    if (symptomInitial !== undefined) appointment.symptomInitial = symptomInitial;

    await appointment.save();

    return res.json({
      success: true,
      message: "APPOINTMENT_UPDATED",
      data: appointment,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const role = req.user!.roleId;
    let filter: any = {};

    if (role === RoleCode.PATIENT) {
      if (!req.user!.patientId) {
        return res.status(400).json({
          success: false,
          message: "PATIENT_NOT_SETUP",
        });
      }
      filter.patientId = req.user!.patientId;
    } else if (role === RoleCode.DOCTOR) {
      if (!req.user!.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }
      filter.doctorId = req.user!.doctorId;
    } else {
      return res.status(403).json({
        success: false,
        message: "ONLY_PATIENT_OR_DOCTOR",
      });
    }

    const data = await getAppointmentsService(filter);

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    const role = req.user!.roleId;
    const { Op } = await import("sequelize");
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    let filter: any = {
      status: "WAITING",
      date: {
        [Op.gte]: new Date().toISOString().split("T")[0], // Today or future
      },
    };

    if (role === RoleCode.PATIENT) {
      if (!req.user!.patientId) {
        return res.status(400).json({
          success: false,
          message: "PATIENT_NOT_SETUP",
        });
      }
      filter.patientId = req.user!.patientId;
    } else if (role === RoleCode.DOCTOR) {
      if (!req.user!.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }
      filter.doctorId = req.user!.doctorId;
    }

    // Use getAppointmentsService to ensure all associations are included
    const appointments = await getAppointmentsService(filter);
    
    // Apply limit and sort
    const limitedAppointments = appointments
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.shiftId || 0) - (b.shiftId || 0);
      })
      .slice(0, limit);

    return res.json({ success: true, data: limitedAppointments });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const markNoShow = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const Appointment = (await import("../models/Appointment")).default;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "APPOINTMENT_NOT_FOUND",
      });
    }

    // Only admin and receptionist can mark no-show
    const role = req.user!.roleId;
    if (role !== RoleCode.ADMIN && role !== RoleCode.RECEPTIONIST) {
      return res.status(403).json({
        success: false,
        message: "ONLY_ADMIN_OR_RECEPTIONIST",
      });
    }

    // Can only mark no-show if status is WAITING
    if (appointment.status !== "WAITING") {
      return res.status(400).json({
        success: false,
        message: "CAN_ONLY_MARK_WAITING_APPOINTMENTS",
      });
    }

    appointment.status = "NO_SHOW";
    await appointment.save();

    return res.json({
      success: true,
      message: "APPOINTMENT_MARKED_NO_SHOW",
      data: appointment,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
