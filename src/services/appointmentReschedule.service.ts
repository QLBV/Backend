import { Transaction, Op } from "sequelize";
import sequelize from "../config/database";
import Appointment from "../models/Appointment";
import DoctorShift, { DoctorShiftStatus } from "../models/DoctorShift";
import Doctor from "../models/Doctor";
import {
  notifyAppointmentCancelled,
  notifyDoctorChanged,
} from "../events/appointmentEvents";

/**
 * Interface cho ket qua reschedule
 */
export interface RescheduleResult {
  totalAppointments: number;
  rescheduledCount: number;
  failedCount: number;
  cancelledCount: number;
  details: Array<{
    appointmentId: number;
    success: boolean;
    newDoctorId?: number;
    error?: string;
  }>;
}

/**
 * Tim bac si thay the cho mot ca lam viec
 * @param originalDoctorId - ID cua bac si goc
 * @param shiftId - ID ca lam viec
 * @param workDate - Ngay lam viec (YYYY-MM-DD)
 * @param transaction - Database transaction
 * @returns ID cua bac si thay the, hoac null neu khong tim thay
 */
export async function findReplacementDoctor(
  originalDoctorId: number,
  shiftId: number,
  workDate: string,
  transaction?: Transaction
): Promise<number | null> {
  // 1. Lay chuyen khoa cua bac si goc
  const originalDoctor = await Doctor.findByPk(originalDoctorId, {
    attributes: ["specialtyId"],
    transaction,
  });

  if (!originalDoctor) {
    return null;
  }

  // 2. Tim cac bac si cung chuyen khoa, dang ACTIVE va co lich lam viec trong ca do
  const replacementCandidates = await DoctorShift.findAll({
    where: {
      shiftId,
      workDate,
      status: DoctorShiftStatus.ACTIVE,
      doctorId: { [Op.ne]: originalDoctorId }, // Khac bac si goc
    },
    include: [
      {
        model: Doctor,
        as: "doctor",
        where: {
          specialtyId: originalDoctor.specialtyId, // Cung chuyen khoa
          isActive: true,
        },
        attributes: ["id", "specialtyId"],
      },
    ],
    transaction,
  });

  if (replacementCandidates.length === 0) {
    return null;
  }

  // 3. Dem so lich hen hien tai cua moi bac si trong ca do
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

  // 4. Chon bac si co it lich hen nhat (load balancing)
  const selectedDoctor = doctorWorkload.reduce((min, current) =>
    current.appointmentCount < min.appointmentCount ? current : min
  );

  return selectedDoctor.doctorId;
}

/**
 * Huy ca lam viec cua bac si va tu dong chuyen lich hen
 * @param doctorShiftId - ID cua doctor shift can huy
 * @param cancelReason - Ly do huy ca
 * @returns RescheduleResult voi thong tin chi tiet
 */
export async function cancelDoctorShiftAndReschedule(
  doctorShiftId: number,
  cancelReason: string
): Promise<RescheduleResult> {
  const transaction = await sequelize.transaction();

  try {
    // 1. Lay thong tin ca lam viec can huy
    const doctorShift = await DoctorShift.findByPk(doctorShiftId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!doctorShift) {
      throw new Error("Khong tim thay ca lam viec");
    }

    if (doctorShift.status !== DoctorShiftStatus.ACTIVE) {
      throw new Error("Ca lam viec khong o trang thai hoat dong");
    }

    // 2. Tim bac si thay the (cung chuyen khoa, cung ca)
    const replacementDoctorId = await findReplacementDoctor(
      doctorShift.doctorId,
      doctorShift.shiftId,
      doctorShift.workDate,
      transaction
    );

    // 3. Lay tat ca appointments bi anh huong
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
      lock: transaction.LOCK.UPDATE,
    });

    const result: RescheduleResult = {
      totalAppointments: appointments.length,
      rescheduledCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      details: [],
    };

    // 4. Xu ly tung lich hen
    for (const appointment of appointments) {
      try {
        if (replacementDoctorId) {
          // Co bac si thay the -> chuyen lich
          const oldDoctorId = appointment.doctorId;
          await appointment.update(
            {
              doctorId: replacementDoctorId,
            },
            { transaction }
          );

          result.rescheduledCount++;
          result.details.push({
            appointmentId: appointment.id,
            success: true,
            newDoctorId: replacementDoctorId,
          });

          // Emit event de gui notification ve viec doi bac si
          // Su dung setImmediate de khong block transaction
          setImmediate(() => {
            notifyDoctorChanged(
              appointment.id,
              oldDoctorId,
              replacementDoctorId,
              `Ca lam viec bi huy: ${cancelReason}`
            );
          });
        } else {
          // Khong co bac si thay the -> huy lich hen
          await appointment.update(
            {
              status: "CANCELLED",
            },
            { transaction }
          );

          result.cancelledCount++;
          result.details.push({
            appointmentId: appointment.id,
            success: false,
            error: "Khong tim thay bac si thay the",
          });

          // Emit event de gui notification ve viec huy lich
          setImmediate(() => {
            notifyAppointmentCancelled(
              appointment.id,
              `Ca lam viec cua bac si bi huy: ${cancelReason}. Khong co bac si thay the cung chuyen khoa.`
            );
          });
        }
      } catch (error: any) {
        result.failedCount++;
        result.details.push({
          appointmentId: appointment.id,
          success: false,
          error: error.message,
        });
      }
    }

    // 5. Cap nhat trang thai ca lam viec
    await doctorShift.update(
      {
        status: DoctorShiftStatus.CANCELLED,
        cancelReason,
        replacedBy: replacementDoctorId,
      },
      { transaction }
    );

    // 6. Commit transaction
    await transaction.commit();

    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Khoi phuc ca lam viec da huy (neu chua co lich hen moi)
 * @param doctorShiftId - ID cua doctor shift can khoi phuc
 * @returns true neu thanh cong
 */
export async function restoreCancelledShift(
  doctorShiftId: number
): Promise<boolean> {
  const transaction = await sequelize.transaction();

  try {
    // 1. Lay thong tin ca lam viec
    const doctorShift = await DoctorShift.findByPk(doctorShiftId, {
      transaction,
    });

    if (!doctorShift) {
      throw new Error("Khong tim thay ca lam viec");
    }

    if (doctorShift.status === DoctorShiftStatus.ACTIVE) {
      throw new Error("Ca lam viec dang hoat dong, khong can khoi phuc");
    }

    // 2. Khoi phuc trang thai
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
