import { Request, Response } from "express";
import {
  cancelDoctorShiftAndReschedule,
  restoreCancelledShift,
} from "../appointment/appointmentReschedule.service";


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


export async function previewReschedule(req: Request, res: Response) {
  try {
    const doctorShiftId = parseInt(req.params.id, 10);

    
    const DoctorShift = (await import("../../models/DoctorShift")).default;
    const Appointment = (await import("../../models/Appointment")).default;
    const { findReplacementDoctor } = await import(
      "../appointment/appointmentReschedule.service"
    );
    const { Op } = (await import("sequelize")).default;

    
    const doctorShift = await DoctorShift.findByPk(doctorShiftId);

    if (!doctorShift) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ca làm việc",
      });
    }

    
    const replacementDoctorId = await findReplacementDoctor(
      doctorShift.doctorId,
      doctorShift.shiftId,
      doctorShift.workDate
    );

    
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
