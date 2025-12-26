import { Transaction, Op } from "sequelize";
import sequelize from "../config/database";
import Appointment from "../models/Appointment";
import DoctorShift, { DoctorShiftStatus } from "../models/DoctorShift";
import Doctor from "../models/Doctor";
import Specialty from "../models/Specialty";
import { notifyDoctorChanged } from "../events/appointmentEvents";

/**
 * Kết quả của quá trình reschedule
 */
export interface RescheduleResult {
  success: boolean;
  totalAppointments: number;
  rescheduledCount: number;
  failedCount: number;
  details: {
    appointmentId: number;
    patientId: number;
    oldDoctorId: number;
    newDoctorId?: number;
    success: boolean;
    reason?: string;
  }[];
}

/**
 * Tìm bác sĩ thay thế phù hợp
 * @param originalDoctorId - ID bác sĩ gốc
 * @param shiftId - ID ca làm việc
 * @param workDate - Ngày làm việc (YYYY-MM-DD)
 * @param transaction - Transaction Sequelize
 * @returns ID của bác sĩ thay thế hoặc null
 */
export async function findReplacementDoctor(
  originalDoctorId: number,
  shiftId: number,
  workDate: string,
  transaction?: Transaction
): Promise<number | null> {
  // 1. Lấy thông tin bác sĩ gốc để biết chuyên khoa
  const originalDoctor = await Doctor.findByPk(originalDoctorId, {
    include: [{ model: Specialty, as: "specialty" }],
    transaction,
  });

  if (!originalDoctor) {
    return null;
  }

  // 2. Tìm các bác sĩ cùng chuyên khoa, đang ACTIVE trong cùng ca và ngày
  const replacementCandidates = await DoctorShift.findAll({
    where: {
      shiftId,
      workDate,
      status: DoctorShiftStatus.ACTIVE,
      doctorId: { [Op.ne]: originalDoctorId }, // Khác bác sĩ gốc
    },
    include: [
      {
        model: Doctor,
        as: "doctor",
        where: {
          specialtyId: originalDoctor.specialtyId, // Cùng chuyên khoa
        },
        required: true,
      },
    ],
    transaction,
  });

  if (replacementCandidates.length === 0) {
    return null;
  }

  // 3. Đếm số lịch hẹn hiện tại của mỗi bác sĩ trong ca đó
  const doctorWorkload = await Promise.all(
    replacementCandidates.map(async (candidate) => {
      const appointmentCount = await Appointment.count({
        where: {
          doctorId: candidate.doctorId,
          shiftId,
          date: workDate,
          status: {
            [Op.in]: ["WAITING", "CHECKED_IN"],
          },
        },
        transaction,
      });

      return {
        doctorId: candidate.doctorId,
        appointmentCount,
      };
    })
  );

  // 4. Chọn bác sĩ có ít lịch hẹn nhất (load balancing)
  doctorWorkload.sort((a, b) => a.appointmentCount - b.appointmentCount);

  return doctorWorkload[0].doctorId;
}

/**
 * Hủy ca làm việc của bác sĩ và tự động chuyển lịch hẹn sang bác sĩ thay thế
 * @param doctorShiftId - ID của DoctorShift cần hủy
 * @param cancelReason - Lý do hủy ca
 * @returns Kết quả reschedule
 */
export async function cancelDoctorShiftAndReschedule(
  doctorShiftId: number,
  cancelReason: string
): Promise<RescheduleResult> {
  const transaction = await sequelize.transaction();

  try {
    // 1. Lấy thông tin ca làm việc
    const doctorShift = await DoctorShift.findByPk(doctorShiftId, {
      transaction,
    });

    if (!doctorShift) {
      throw new Error("Không tìm thấy ca làm việc");
    }

    if (doctorShift.status !== DoctorShiftStatus.ACTIVE) {
      throw new Error("Ca làm việc đã được hủy hoặc thay thế");
    }

    // 2. Tìm bác sĩ thay thế
    const replacementDoctorId = await findReplacementDoctor(
      doctorShift.doctorId,
      doctorShift.shiftId,
      doctorShift.workDate,
      transaction
    );

    // 3. Lấy tất cả lịch hẹn của bác sĩ trong ca này
    const appointments = await Appointment.findAll({
      where: {
        doctorId: doctorShift.doctorId,
        shiftId: doctorShift.shiftId,
        date: doctorShift.workDate,
        status: {
          [Op.in]: ["WAITING", "CHECKED_IN"],
        },
      },
      transaction,
    });

    const result: RescheduleResult = {
      success: false,
      totalAppointments: appointments.length,
      rescheduledCount: 0,
      failedCount: 0,
      details: [],
    };

    // 4. Xử lý từng lịch hẹn
    for (const appointment of appointments) {
      if (replacementDoctorId) {
        // Có bác sĩ thay thế -> chuyển lịch
        await appointment.update(
          { doctorId: replacementDoctorId },
          { transaction }
        );

        result.rescheduledCount++;
        result.details.push({
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          oldDoctorId: doctorShift.doctorId,
          newDoctorId: replacementDoctorId,
          success: true,
        });
      } else {
        // Không có bác sĩ thay thế -> đánh dấu thất bại
        result.failedCount++;
        result.details.push({
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          oldDoctorId: doctorShift.doctorId,
          success: false,
          reason: "Không tìm thấy bác sĩ thay thế cùng chuyên khoa",
        });
      }
    }

    // 5. Cập nhật trạng thái DoctorShift
    await doctorShift.update(
      {
        status: replacementDoctorId
          ? DoctorShiftStatus.REPLACED
          : DoctorShiftStatus.CANCELLED,
        replacedBy: replacementDoctorId,
        cancelReason,
      },
      { transaction }
    );

    await transaction.commit();

    // 6. 🆕 Emit events để gửi notifications (sau khi commit thành công)
    if (replacementDoctorId) {
      for (const detail of result.details) {
        if (detail.success && detail.newDoctorId) {
          // Gửi notification cho từng bệnh nhân về việc đổi bác sĩ
          notifyDoctorChanged(
            detail.appointmentId,
            detail.oldDoctorId,
            detail.newDoctorId,
            cancelReason
          );
        }
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Khôi phục ca làm việc đã hủy (nếu chưa có lịch hẹn mới)
 * @param doctorShiftId - ID của DoctorShift cần khôi phục
 * @returns boolean
 */
export async function restoreCancelledShift(
  doctorShiftId: number
): Promise<boolean> {
  const transaction = await sequelize.transaction();

  try {
    const doctorShift = await DoctorShift.findByPk(doctorShiftId, {
      transaction,
    });

    if (!doctorShift) {
      throw new Error("Không tìm thấy ca làm việc");
    }

    if (doctorShift.status === DoctorShiftStatus.ACTIVE) {
      throw new Error("Ca làm việc đang hoạt động, không cần khôi phục");
    }

    // Khôi phục trạng thái
    await doctorShift.update(
      {
        status: DoctorShiftStatus.ACTIVE,
        replacedBy: null,
        cancelReason: null,
      },
      { transaction }
    );

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
