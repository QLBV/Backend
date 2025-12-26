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

    // 🆕 Emit event để gửi notification
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

    // 🆕 Emit event để gửi notification hủy lịch
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

    // 🔐 Nếu là PATIENT, chỉ cho xem lịch của chính mình
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

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};
