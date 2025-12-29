import { Request, Response } from "express";
import {
  cancelDoctorShiftAndReschedule,
  restoreCancelledShift,
} from "../services/appointmentReschedule.service";

/**
 * POST /api/doctor-shifts/:id/cancel-and-reschedule
 * Hủy ca làm việc của bác sĩ và tự động chuyển lịch hẹn sang bác sĩ thay thế
 */
export async function cancelShiftAndReschedule(req: Request, res: Response) {
  try {
    const doctorShiftId = parseInt(req.params.id, 10);
    const { cancelReason } = req.body;

    if (!cancelReason || cancelReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp lý do hủy ca",
      });
    }

    const result = await cancelDoctorShiftAndReschedule(
      doctorShiftId,
      cancelReason
    );

    // Tạo thông báo chi tiết
    let message = `Đã xử lý ${result.totalAppointments} lịch hẹn. `;
    if (result.rescheduledCount > 0) {
      message += `Chuyển thành công ${result.rescheduledCount} lịch. `;
    }
    if (result.failedCount > 0) {
      message += `${result.failedCount} lịch không thể chuyển (không tìm thấy bác sĩ thay thế).`;
    }

    return res.status(200).json({
      success: true,
      message,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in cancelShiftAndReschedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi hủy ca và chuyển lịch hẹn",
    });
  }
}

/**
 * POST /api/doctor-shifts/:id/restore
 * Khôi phục ca làm việc đã hủy
 */
export async function restoreShift(req: Request, res: Response) {
  try {
    const doctorShiftId = parseInt(req.params.id, 10);

    await restoreCancelledShift(doctorShiftId);

    return res.status(200).json({
      success: true,
      message: "Khôi phục ca làm việc thành công",
    });
  } catch (error: any) {
    console.error("Error in restoreShift:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi khôi phục ca làm việc",
    });
  }
}

/**
 * GET /api/doctor-shifts/:id/reschedule-preview
 * Xem trước kết quả nếu hủy ca (không thực sự hủy)
 */
export async function previewReschedule(req: Request, res: Response) {
  try {
    const doctorShiftId = parseInt(req.params.id, 10);

    // Import các model cần thiết
    const DoctorShift = (await import("../models/DoctorShift")).default;
    const Appointment = (await import("../models/Appointment")).default;
    const { findReplacementDoctor } = await import(
      "../services/appointmentReschedule.service"
    );
    const { Op } = (await import("sequelize")).default;

    // Lấy thông tin ca làm việc
    const doctorShift = await DoctorShift.findByPk(doctorShiftId);

    if (!doctorShift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc",
      });
    }

    // Tìm bác sĩ thay thế
    const replacementDoctorId = await findReplacementDoctor(
      doctorShift.doctorId,
      doctorShift.shiftId,
      doctorShift.workDate
    );

    // Đếm số lịch hẹn sẽ bị ảnh hưởng
    const affectedAppointments = await Appointment.count({
      where: {
        doctorId: doctorShift.doctorId,
        shiftId: doctorShift.shiftId,
        date: doctorShift.workDate,
        status: {
          [Op.in]: ["WAITING", "CHECKED_IN"],
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        doctorShiftId,
        affectedAppointments,
        hasReplacementDoctor: replacementDoctorId !== null,
        replacementDoctorId,
        canAutoReschedule: replacementDoctorId !== null,
        warning:
          replacementDoctorId === null && affectedAppointments > 0
            ? "CẢNH BÁO: Không tìm thấy bác sĩ thay thế cùng chuyên khoa. Các lịch hẹn sẽ không thể tự động chuyển."
            : null,
      },
    });
  } catch (error: any) {
    console.error("Error in previewReschedule:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi xem trước",
    });
  }
}
