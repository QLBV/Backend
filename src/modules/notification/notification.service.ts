import Notification, { NotificationType } from "../../models/Notification";
import Appointment from "../../models/Appointment";
import Patient from "../../models/Patient";
import Doctor from "../../models/Doctor";
import Shift from "../../models/Shift";
import User from "../../models/User";
import Specialty from "../../models/Specialty";
import { sendEmail } from "../../services/email.service";
import { emailTemplates } from "../../templates/emailTemplates";
import {
  calculateAppointmentTime,
  formatShiftTime,
} from "../../utils/appointmentTimeCalculator";


interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedAppointmentId?: number;
}


export async function createNotification(
  params: CreateNotificationParams
): Promise<Notification> {
  const notification = await Notification.create({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    relatedAppointmentId: params.relatedAppointmentId,
  });

  return notification;
}


export async function sendAppointmentConfirmation(
  appointmentId: number
): Promise<void> {
  try {
    
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: Patient,
          as: "patient",
          include: [{ model: User, as: "user" }],
        },
        {
          model: Doctor,
          as: "doctor",
          include: [
            { model: User, as: "user" },
            { model: Specialty, as: "specialty" },
          ],
        },
        { model: Shift, as: "shift" },
      ],
    });

    if (!appointment) {
      console.error(`Appointment ${appointmentId} not found`);
      return;
    }

    const patient = appointment.get("patient") as any;
    const doctor = appointment.get("doctor") as any;
    const shift = appointment.get("shift") as any;

    if (!patient || !doctor || !shift) {
      console.error("Missing related data for appointment", appointmentId);
      return;
    }

    const patientUser = patient.user;
    const doctorUser = doctor.user;
    const specialty = doctor.specialty;

    
    const notification = await createNotification({
      userId: patientUser.id,
      type: NotificationType.APPOINTMENT_CREATED,
      title: "Lịch khám mới được tạo",
      message: `Bạn có lịch khám với ${doctorUser.fullName} vào ${shift.name} ngày ${appointment.date}`,
      relatedAppointmentId: appointmentId,
    });

    
    const appointmentTime = calculateAppointmentTime(shift.startTime, appointment.slotNumber);
    const shiftTime = formatShiftTime(shift.startTime, shift.endTime);

    const emailHtml = emailTemplates.appointmentConfirmation({
      patientName: patientUser.fullName,
      doctorName: doctorUser.fullName,
      doctorSpecialty: specialty?.name || "Chưa xác định",
      appointmentDate: appointment.date.toString(),
      shiftName: shift.name,
      shiftTime: shiftTime,
      appointmentTime: appointmentTime,
      slotNumber: appointment.slotNumber,
      appointmentId: appointment.id,
    });

    
    const emailSent = await sendEmail({
      to: patientUser.email,
      subject: "Xác nhận lịch khám - Hệ thống Phòng khám",
      html: emailHtml,
    });

    
    if (emailSent) {
      await notification.update({
        emailSent: true,
        emailSentAt: new Date(),
      });
      console.log(`Sent appointment confirmation to ${patientUser.email}`);
    }
  } catch (error) {
    console.error("Error in sendAppointmentConfirmation:", error);
  }
}


export async function sendAppointmentCancellation(
  appointmentId: number,
  reason?: string
): Promise<void> {
  try {
    
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: Patient,
          as: "patient",
          include: [{ model: User, as: "user" }],
        },
        {
          model: Doctor,
          as: "doctor",
          include: [{ model: User, as: "user" }],
        },
        { model: Shift, as: "shift" },
      ],
    });

    if (!appointment) {
      console.error(`Appointment ${appointmentId} not found`);
      return;
    }

    const patient = appointment.get("patient") as any;
    const doctor = appointment.get("doctor") as any;
    const shift = appointment.get("shift") as any;

    if (!patient || !doctor || !shift) {
      console.error("Missing related data for appointment", appointmentId);
      return;
    }

    const patientUser = patient.user;
    const doctorUser = doctor.user;

    
    const notification = await createNotification({
      userId: patientUser.id,
      type: NotificationType.APPOINTMENT_CANCELLED,
      title: "Lịch khám đã bị hủy",
      message: `Lịch khám với ${doctorUser.fullName} vào ${shift.name} ngày ${
        appointment.date
      } đã bị hủy${reason ? `: ${reason}` : ""}`,
      relatedAppointmentId: appointmentId,
    });

    
    const appointmentTime = calculateAppointmentTime(shift.startTime, appointment.slotNumber);
    const shiftTime = formatShiftTime(shift.startTime, shift.endTime);

    const emailHtml = emailTemplates.appointmentCancellation({
      patientName: patientUser.fullName,
      doctorName: doctorUser.fullName,
      appointmentDate: appointment.date.toString(),
      shiftName: shift.name,
      shiftTime: shiftTime,
      appointmentTime: appointmentTime,
      reason,
      appointmentId: appointment.id,
    });

    
    const emailSent = await sendEmail({
      to: patientUser.email,
      subject: "Thông báo hủy lịch khám - Hệ thống Phòng khám",
      html: emailHtml,
    });

    
    if (emailSent) {
      await notification.update({
        emailSent: true,
        emailSentAt: new Date(),
      });
      console.log(` Sent cancellation notification to ${patientUser.email}`);
    }
  } catch (error) {
    console.error("Error in sendAppointmentCancellation:", error);
  }
}


export async function sendDoctorChangeNotification(
  appointmentId: number,
  oldDoctorId: number,
  newDoctorId: number,
  reason?: string
): Promise<void> {
  try {
    
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: Patient,
          as: "patient",
          include: [{ model: User, as: "user" }],
        },
        {
          model: Doctor,
          as: "doctor",
          include: [
            { model: User, as: "user" },
            { model: Specialty, as: "specialty" },
          ],
        },
        { model: Shift, as: "shift" },
      ],
    });

    if (!appointment) {
      console.error(`Appointment ${appointmentId} not found`);
      return;
    }

    
    const oldDoctor = await Doctor.findByPk(oldDoctorId, {
      include: [{ model: User, as: "user" }],
    });

    if (!oldDoctor) {
      console.error(`Old doctor ${oldDoctorId} not found`);
      return;
    }

    const patient = appointment.get("patient") as any;
    const newDoctor = appointment.get("doctor") as any;
    const shift = appointment.get("shift") as any;

    if (!patient || !newDoctor || !shift) {
      console.error("Missing related data for appointment", appointmentId);
      return;
    }

    const patientUser = patient.user;
    const newDoctorUser = newDoctor.user;
    const oldDoctorUser = (oldDoctor as any).user;
    const specialty = newDoctor.specialty;

    
    const notification = await createNotification({
      userId: patientUser.id,
      type: NotificationType.DOCTOR_CHANGED,
      title: "Bác sĩ khám đã thay đổi",
      message: `Bác sĩ khám của bạn đã thay đổi từ ${oldDoctorUser.fullName} sang ${newDoctorUser.fullName}`,
      relatedAppointmentId: appointmentId,
    });

    
    const appointmentTime = calculateAppointmentTime(shift.startTime, appointment.slotNumber);
    const shiftTime = formatShiftTime(shift.startTime, shift.endTime);

    const emailHtml = emailTemplates.doctorChanged({
      patientName: patientUser.fullName,
      oldDoctorName: oldDoctorUser.fullName,
      newDoctorName: newDoctorUser.fullName,
      newDoctorSpecialty: specialty?.name || "Chưa xác định",
      appointmentDate: appointment.date.toString(),
      shiftName: shift.name,
      shiftTime: shiftTime,
      appointmentTime: appointmentTime,
      slotNumber: appointment.slotNumber,
      reason,
      appointmentId: appointment.id,
    });

    
    const emailSent = await sendEmail({
      to: patientUser.email,
      subject: " Thông báo thay đổi bác sĩ - Hệ thống Phòng khám",
      html: emailHtml,
    });

    
    if (emailSent) {
      await notification.update({
        emailSent: true,
        emailSentAt: new Date(),
      });
      console.log(` Sent doctor change notification to ${patientUser.email}`);
    }
  } catch (error) {
    console.error("Error in sendDoctorChangeNotification:", error);
  }
}


export async function sendAppointmentRescheduleNotification(
  appointmentId: number,
  oldDetails: { doctorId: number; shiftId: number; date: Date }
): Promise<void> {
  try {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: Patient,
          as: "patient",
          include: [{ model: User, as: "user" }],
        },
        {
          model: Doctor,
          as: "doctor",
          include: [
            { model: User, as: "user" },
            { model: Specialty, as: "specialty" },
          ],
        },
        { model: Shift, as: "shift" },
      ],
    });

    if (!appointment) {
      console.error(`Appointment ${appointmentId} not found`);
      return;
    }

    const patient = appointment.get("patient") as any;
    const doctor = appointment.get("doctor") as any;
    const shift = appointment.get("shift") as any;

    if (!patient || !doctor || !shift) {
      console.error("Missing related data for appointment", appointmentId);
      return;
    }

    const patientUser = patient.user;
    const newDoctorUser = doctor.user;
    const oldDoctor = await Doctor.findByPk(oldDetails.doctorId, {
      include: [{ model: User, as: "user" }],
    });
    const oldShift = await Shift.findByPk(oldDetails.shiftId);

    const oldDoctorData = oldDoctor as any;
    if (!oldDoctor || !oldDoctorData.user || !oldShift) {
      console.error("Missing old doctor/shift data for reschedule", appointmentId);
      return;
    }

    const notification = await createNotification({
      userId: patientUser.id,
      type: NotificationType.APPOINTMENT_RESCHEDULED,
      title: "Lịch khám đã được cập nhật",
      message: `Lịch #${appointmentId} đã chuyển từ ${oldShift.name} ngày ${oldDetails.date.toDateString()} sang ${shift.name} ngày ${appointment.date}`,
      relatedAppointmentId: appointmentId,
    });

    
    const oldAppointmentTime = calculateAppointmentTime(oldShift.startTime, appointment.slotNumber);
    const newAppointmentTime = calculateAppointmentTime(shift.startTime, appointment.slotNumber);
    const oldShiftTime = formatShiftTime(oldShift.startTime, oldShift.endTime);
    const newShiftTime = formatShiftTime(shift.startTime, shift.endTime);

    const emailHtml = emailTemplates.appointmentRescheduled({
      patientName: patientUser.fullName,
      oldDate: oldDetails.date.toString(),
      newDate: appointment.date.toString(),
      oldShiftName: oldShift.name,
      newShiftName: shift.name,
      oldShiftTime: oldShiftTime,
      newShiftTime: newShiftTime,
      oldAppointmentTime: oldAppointmentTime,
      newAppointmentTime: newAppointmentTime,
      oldDoctorName: oldDoctorData.user.fullName,
      newDoctorName: newDoctorUser.fullName,
      appointmentId: appointment.id,
    });

    const emailSent = await sendEmail({
      to: patientUser.email,
      subject: "Thông báo đổi lịch khám - Hệ thống Phòng khám",
      html: emailHtml,
    });

    if (emailSent) {
      await notification.update({
        emailSent: true,
        emailSentAt: new Date(),
      });
      console.log(`Sent reschedule notification to ${patientUser.email}`);
    }
  } catch (error) {
    console.error("Error in sendAppointmentRescheduleNotification:", error);
  }
}


export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<boolean> {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return false;
    }

    await notification.update({ isRead: true });
    return true;
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    return false;
  }
}


export async function markAllNotificationsAsRead(
  userId: number
): Promise<number> {
  try {
    const [affectedCount] = await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    return affectedCount;
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    return 0;
  }
}


export async function getUserNotifications(
  userId: number,
  options: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  } = {}
) {
  const { page = 1, limit = 10, isRead } = options;

  const where: any = { userId };
  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}


export async function getUnreadCount(userId: number): Promise<number> {
  return Notification.count({
    where: { userId, isRead: false },
  });
}


export async function deleteNotification(
  notificationId: number,
  userId: number
): Promise<boolean> {
  try {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return false;
    }

    await notification.destroy();
    return true;
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    return false;
  }
}
