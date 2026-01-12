import { Request, Response } from "express";
import { createAppointmentService } from "../services/appointment.service";
import { RoleCode } from "../constant/role";
import { cancelAppointmentService } from "../services/appointmentCancel.service";
import { getAppointmentsService } from "../services/appointmentQuery.service";
import {
  notifyAppointmentCreated,
  notifyAppointmentCancelled,
} from "../events/appointmentEvents";
import { getDisplayStatus } from "../utils/statusMapper";
import * as auditLogService from "../services/auditLog.service";
import { AppointmentStateMachine } from "../utils/stateMachine";
import { AppointmentStatus } from "../constant/appointment";
import { sendAppointmentRescheduleNotification } from "../services/notification.service";

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

    // AUDIT LOG: Log appointment creation
    await auditLogService.logCreate(req, "appointments", appointment.id, {
      appointmentCode: appointment.appointmentCode,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      shiftId: appointment.shiftId,
      date: appointment.date,
      bookingType: appointment.bookingType,
      bookedBy: appointment.bookedBy,
      status: appointment.status,
    }).catch(err => console.error("Failed to log appointment creation audit:", err));

    //  Emit event để gửi notification
    notifyAppointmentCreated(appointment.id);

    // Calculate displayStatus (new appointments are always WAITING with no visit)
    const displayStatus = getDisplayStatus({ status: appointment.status }, null);

    return res.json({
      success: true,
      message: "APPOINTMENT_CREATED",
      data: {
        ...appointment.toJSON(),
        displayStatus,
      },
    });
    
  } catch (e: any) {
    const map: Record<string, string> = {
      DOCTOR_NOT_ON_DUTY: "Bác sĩ không trực ca này",
      SHIFT_FULL: "Ca khám đã đủ lượt",
      DAY_FULL: "Bác sĩ đã đủ 40 lịch trong ngày",
      CANNOT_BOOK_PAST_DATE: "Không thể đặt lịch cho ngày trong quá khứ",
      DOCTOR_NOT_AVAILABLE: "Bác sĩ hiện không tiếp nhận bệnh nhân",
      PATIENT_BLOCKED_DUE_TO_NO_SHOWS: "Tài khoản bị tạm khóa do vi phạm nội quy (vắng mặt nhiều lần)",
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

    // AUDIT LOG: Log appointment cancellation
    await auditLogService.logUpdate(req, "appointments", result.id,
      { status: "WAITING" },
      { status: result.status, cancelledBy: req.user!.userId }
    ).catch(err => console.error("Failed to log appointment cancellation audit:", err));

    //  Emit event để gửi notification hủy lịch
    notifyAppointmentCancelled(id, "Bệnh nhân hủy lịch");

    // Calculate displayStatus (cancelled appointments have no visit)
    const displayStatus = getDisplayStatus({ status: result.status }, null);

    return res.json({
      success: true,
      message: "APPOINTMENT_CANCELLED",
      data: {
        ...result.toJSON(),
        displayStatus,
      },
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

    // Role-based filtering
    let patientIdFilter: number | undefined = undefined;
    let doctorIdFilter = doctorId;

    if (req.user?.roleId === RoleCode.PATIENT) {
      if (!req.user.patientId) {
        return res.status(400).json({
          success: false,
          message: "PATIENT_NOT_SETUP",
        });
      }
      patientIdFilter = req.user.patientId;
    } else if (req.user?.roleId === RoleCode.DOCTOR) {
      if (!req.user.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }
      doctorIdFilter = req.user.doctorId;
    }

    const data = await getAppointmentsService({
      date,
      doctorId: doctorIdFilter,
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
    const Visit = (await import("../models/Visit")).default;

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
        {
          model: Visit,
          as: "visit",
          required: false,
          attributes: ["id", "checkInTime", "diagnosis", "status"],
        },
      ],
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "APPOINTMENT_NOT_FOUND",
      });
    }

    // Check permission: patient can only view their own, doctor can view theirs, admin/receptionist can view all
    const roleId = req.user!.roleId;
    const normalizedRole = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;

    const isAdmin = normalizedRole === RoleCode.ADMIN;
    const isReceptionist = normalizedRole === RoleCode.RECEPTIONIST;

    const appointmentData = appointment.toJSON ? appointment.toJSON() : appointment;
    const responseData = {
      ...appointmentData,
      displayStatus: getDisplayStatus(
        { status: appointmentData.status },
        appointmentData.visit ? { status: appointmentData.visit.status } : null
      ),
    };

    if (isAdmin || isReceptionist) {
      return res.json({ success: true, data: responseData });
    }

    if (normalizedRole === RoleCode.PATIENT) {
      if (appointment.patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }
    else if (normalizedRole === RoleCode.DOCTOR) {
      if (appointment.doctorId !== req.user!.doctorId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

    return res.json({ success: true, data: responseData });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { doctorId, shiftId, date, symptomInitial } = req.body;

    const Appointment = (await import("../models/Appointment")).default;
    const DoctorShift = (await import("../models/DoctorShift")).default;
    const Shift = (await import("../models/Shift")).default;
    const { AppointmentStatus } = await import("../models/Appointment");
    const { Op, Transaction } = await import("sequelize");
    const { sequelize } = await import("../models");
    const { BOOKING_CONFIG } = await import("../config/booking.config");

    // Get old data BEFORE transaction (for audit log and permission check)
    const existingAppt = await Appointment.findByPk(id);
    if (!existingAppt) {
      return res.status(404).json({
        success: false,
        message: "APPOINTMENT_NOT_FOUND",
      });
    }

    if (existingAppt.status !== AppointmentStatus.WAITING) {
      return res.status(400).json({
        success: false,
        message: "CAN_ONLY_UPDATE_WAITING_APPOINTMENTS",
      });
    }

    // Permission check (before transaction)
    const role = req.user!.roleId;
    if (role === RoleCode.PATIENT) {
      if (existingAppt.patientId !== req.user!.patientId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN",
        });
      }
    }

    const oldData = {
      doctorId: existingAppt.doctorId,
      shiftId: existingAppt.shiftId,
      date: existingAppt.date,
      symptomInitial: existingAppt.symptomInitial,
    };

    // Wrap entire update logic in transaction
    const result = await sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (t) => {
        // Lock appointment row
        const appointment = await Appointment.findByPk(id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");
        if (appointment.status !== AppointmentStatus.WAITING) {
          throw new Error("CAN_ONLY_UPDATE_WAITING_APPOINTMENTS");
        }

        // Determine if rescheduling
        const newDoctorId = doctorId !== undefined ? Number(doctorId) : appointment.doctorId;
        const newShiftId = shiftId !== undefined ? Number(shiftId) : appointment.shiftId;
        const newDate = date !== undefined ? new Date(date) : appointment.date;

        const isRescheduled =
          newDoctorId !== appointment.doctorId ||
          newShiftId !== appointment.shiftId ||
          newDate.getTime() !== appointment.date.getTime();

        if (isRescheduled) {
          const newDateStr = newDate.toISOString().split("T")[0];

          // Lock DoctorShift (serialize bookings for this shift)
          const ds = await DoctorShift.findOne({
            where: {
              doctorId: newDoctorId,
              shiftId: newShiftId,
              workDate: newDateStr,
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (!ds) throw new Error("DOCTOR_NOT_ON_DUTY");

          // Check daily capacity (exclude current appointment)
          const dayCount = await Appointment.count({
            where: {
              doctorId: newDoctorId,
              date: newDateStr,
              status: { [Op.ne]: AppointmentStatus.CANCELLED },
              id: { [Op.ne]: id },
            },
            transaction: t,
          });

          if (dayCount >= BOOKING_CONFIG.MAX_APPOINTMENTS_PER_DAY) {
            throw new Error("DAY_FULL");
          }

          // Check shift capacity
          const shiftCount = await Appointment.count({
            where: {
              doctorId: newDoctorId,
              shiftId: newShiftId,
              date: newDateStr,
              status: { [Op.ne]: AppointmentStatus.CANCELLED },
              id: { [Op.ne]: id },
            },
            transaction: t,
          });

          if (shiftCount >= BOOKING_CONFIG.MAX_SLOTS_PER_SHIFT) {
            throw new Error("SHIFT_FULL");
          }

          // Check patient overlap
          const patientAppointments = await Appointment.findAll({
            where: {
              patientId: appointment.patientId,
              date: newDateStr,
              status: {
                [Op.in]: [
                  AppointmentStatus.WAITING,
                  AppointmentStatus.CHECKED_IN,
                  AppointmentStatus.IN_PROGRESS,
                ],
              },
              id: { [Op.ne]: id },
            },
            include: [
              {
                model: Shift,
                as: "shift",
                attributes: ["startTime", "endTime"],
              },
            ],
            transaction: t,
          });

          if (patientAppointments.length > 0) {
            const newShift = await Shift.findByPk(newShiftId, { transaction: t });
            if (!newShift) throw new Error("SHIFT_NOT_FOUND");

            for (const existingAppt of patientAppointments) {
              const existingShift = (existingAppt as any).shift;
              if (!existingShift) continue;

              if (
                newShift.startTime < existingShift.endTime &&
                existingShift.startTime < newShift.endTime
              ) {
                throw new Error("PATIENT_ALREADY_HAS_OVERLAPPING_APPOINTMENT");
              }
            }
          }
        }

        // Apply updates
        if (doctorId !== undefined) appointment.doctorId = Number(doctorId);
        if (shiftId !== undefined) appointment.shiftId = Number(shiftId);
        if (date !== undefined) appointment.date = new Date(date);
        if (symptomInitial !== undefined) {
          appointment.symptomInitial = symptomInitial;
        }

        await appointment.save({ transaction: t });

        return { appointment, isRescheduled };
      }
    );

    // Audit log (outside transaction)
    const newData = {
      doctorId: result.appointment.doctorId,
      shiftId: result.appointment.shiftId,
      date: result.appointment.date,
      symptomInitial: result.appointment.symptomInitial,
    };

    await auditLogService
      .logUpdate(req, "appointments", result.appointment.id, oldData, newData)
      .catch((err) => console.error("Failed to log appointment update audit:", err));

    // Send notification if rescheduled
    if (result.isRescheduled) {
      try {
        await sendAppointmentRescheduleNotification(result.appointment.id, {
          doctorId: oldData.doctorId,
          shiftId: oldData.shiftId,
          date: oldData.date,
        });
      } catch (notifyErr) {
        console.error("Failed to send reschedule notification:", notifyErr);
      }
    }

    const displayStatus = getDisplayStatus(
      { status: result.appointment.status },
      null
    );

    return res.json({
      success: true,
      message: "APPOINTMENT_UPDATED",
      data: {
        ...result.appointment.toJSON(),
        displayStatus,
      },
    });
  } catch (e: any) {
    console.error("Error updating appointment:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "INTERNAL_SERVER_ERROR",
    });
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
        [Op.gte]: new Date().toISOString().split("T")[0],
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

    const appointments = await getAppointmentsService(filter);
    
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

    const role = req.user!.roleId;
    if (role !== RoleCode.ADMIN && role !== RoleCode.RECEPTIONIST) {
      return res.status(403).json({
        success: false,
        message: "ONLY_ADMIN_OR_RECEPTIONIST",
      });
    }

    try {
      AppointmentStateMachine.validateTransition(
        appointment.status as AppointmentStatus,
        AppointmentStatus.NO_SHOW
      );
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "INVALID_STATUS_TRANSITION",
      });
    }

    appointment.status = AppointmentStatus.NO_SHOW;
    await appointment.save();

    const Patient = (await import("../models/Patient")).default;
    const patient = await Patient.findByPk(appointment.patientId);
    if (patient) {
      patient.noShowCount = (patient.noShowCount || 0) + 1;
      patient.lastNoShowDate = new Date();
      await patient.save();
    }

    await auditLogService.logUpdate(req, "appointments", appointment.id,
      { status: "WAITING" },
      { status: appointment.status, patientNoShowCount: patient?.noShowCount }
    ).catch(err => console.error("Failed to log no-show audit:", err));

    const displayStatus = getDisplayStatus({ status: appointment.status }, null);

    return res.json({
      success: true,
      message: "APPOINTMENT_MARKED_NO_SHOW",
      data: {
        ...appointment.toJSON(),
        displayStatus,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
