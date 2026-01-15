import { Transaction, Op } from "sequelize";
import sequelize from "../../config/database";
import Appointment from "../../models/Appointment";
import DoctorShift, { DoctorShiftStatus } from "../../models/DoctorShift";
import Doctor from "../../models/Doctor";
import {
  notifyAppointmentCancelled,
  notifyDoctorChanged,
} from "../../events/appointmentEvents";


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


export async function findReplacementDoctor(
  originalDoctorId: number,
  shiftId: number,
  workDate: string,
  transaction?: Transaction
): Promise<number | null> {
  
  const originalDoctor = await Doctor.findByPk(originalDoctorId, {
    attributes: ["specialtyId"],
    transaction,
  });

  if (!originalDoctor) {
    return null;
  }

  
  const replacementCandidates = await DoctorShift.findAll({
    where: {
      shiftId,
      workDate,
      status: DoctorShiftStatus.ACTIVE,
      doctorId: { [Op.ne]: originalDoctorId }, 
    },
    include: [
      {
        model: Doctor,
        as: "doctor",
        where: {
          specialtyId: originalDoctor.specialtyId, 
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

  
  const selectedDoctor = doctorWorkload.reduce((min, current) =>
    current.appointmentCount < min.appointmentCount ? current : min
  );

  return selectedDoctor.doctorId;
}


export async function cancelDoctorShiftAndReschedule(
  doctorShiftId: number,
  cancelReason: string
): Promise<RescheduleResult> {
  const transaction = await sequelize.transaction();

  try {
    
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

    
    const replacementDoctorId = await findReplacementDoctor(
      doctorShift.doctorId,
      doctorShift.shiftId,
      doctorShift.workDate,
      transaction
    );

    
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

    
    for (const appointment of appointments) {
      try {
        if (replacementDoctorId) {
          
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

          
          
          setImmediate(() => {
            notifyDoctorChanged(
              appointment.id,
              oldDoctorId,
              replacementDoctorId,
              `Ca lam viec bi huy: ${cancelReason}`
            );
          });
        } else {
          
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

    
    await doctorShift.update(
      {
        status: DoctorShiftStatus.CANCELLED,
        cancelReason,
        replacedBy: replacementDoctorId,
      },
      { transaction }
    );

    
    await transaction.commit();

    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}


export async function restoreCancelledShift(
  doctorShiftId: number
): Promise<boolean> {
  const transaction = await sequelize.transaction();

  try {
    
    const doctorShift = await DoctorShift.findByPk(doctorShiftId, {
      transaction,
    });

    if (!doctorShift) {
      throw new Error("Khong tim thay ca lam viec");
    }

    if (doctorShift.status === DoctorShiftStatus.ACTIVE) {
      throw new Error("Ca lam viec dang hoat dong, khong can khoi phuc");
    }

    
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
