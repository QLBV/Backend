import { Transaction } from "sequelize";
import { sequelize } from "../../models/index";
import DoctorShift, { DoctorShiftStatus } from "../../models/DoctorShift";
import Shift from "../../models/Shift";
import Doctor from "../../models/Doctor";
import { AppError } from "../../utils/AppError";


export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  
  
  return start1 < end2 && start2 < end1;
}


export async function validateNoOverlappingShifts(
  doctorId: number,
  shiftId: number,
  workDate: string,
  transaction: Transaction
): Promise<void> {
  
  const newShift = await Shift.findByPk(shiftId, { transaction });
  if (!newShift) {
    throw new AppError("SHIFT_NOT_FOUND", "Shift not found", 404);
  }

  
  
  const existingShifts = await DoctorShift.findAll({
    where: {
      doctorId,
      workDate,
      status: DoctorShiftStatus.ACTIVE, 
    },
    include: [
      {
        model: Shift,
        as: "shift",
        attributes: ["id", "name", "startTime", "endTime"],
      },
    ],
    transaction,
    lock: transaction.LOCK.UPDATE, 
  });

  
  for (const existing of existingShifts) {
    const existingShift = existing.shift;
    if (!existingShift) continue;

    
    if (existingShift.id === shiftId) continue;

    if (
      checkTimeOverlap(
        newShift.startTime,
        newShift.endTime,
        existingShift.startTime,
        existingShift.endTime
      )
    ) {
      throw new AppError(
        "DOCTOR_SHIFT_OVERLAP",
        `Doctor already assigned to ${existingShift.name} (${existingShift.startTime}-${existingShift.endTime}) which overlaps with ${newShift.name} (${newShift.startTime}-${newShift.endTime})`,
        409
      );
    }
  }
}


export async function assignDoctorToShiftService(
  doctorId: number,
  shiftId: number,
  workDate: string,
  maxSlots?: number | null
): Promise<DoctorShift> {
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      
      const doctor = await Doctor.findByPk(doctorId, { transaction: t });
      if (!doctor) {
        throw new AppError("DOCTOR_NOT_FOUND", "Doctor not found", 404);
      }
      if (!doctor.isActive) {
        throw new AppError(
          "DOCTOR_INACTIVE",
          "Cannot assign inactive doctor to shift",
          400
        );
      }

      
      await validateNoOverlappingShifts(doctorId, shiftId, workDate, t);

      
      const doctorShift = await DoctorShift.create(
        {
          doctorId,
          shiftId,
          workDate,
          status: DoctorShiftStatus.ACTIVE,
          maxSlots,
        },
        { transaction: t }
      );

      return doctorShift;
    }
  );
}


export async function updateDoctorShiftService(
  id: number,
  updates: {
    shiftId?: number;
    workDate?: string;
    status?: DoctorShiftStatus;
    cancelReason?: string;
  }
): Promise<DoctorShift> {
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      
      const doctorShift = await DoctorShift.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!doctorShift) {
        throw new AppError("DOCTOR_SHIFT_NOT_FOUND", "Doctor shift not found", 404);
      }

      
      const isShiftChanged = updates.shiftId !== undefined && updates.shiftId !== doctorShift.shiftId;
      const isDateChanged = updates.workDate !== undefined && updates.workDate !== doctorShift.workDate;

      
      if ((isShiftChanged || isDateChanged) && updates.status !== DoctorShiftStatus.CANCELLED) {
        const newShiftId = updates.shiftId ?? doctorShift.shiftId;
        const newWorkDate = updates.workDate ?? doctorShift.workDate;

        await validateNoOverlappingShifts(
          doctorShift.doctorId,
          newShiftId,
          newWorkDate,
          t
        );
      }

      
      if (updates.shiftId !== undefined) doctorShift.shiftId = updates.shiftId;
      if (updates.workDate !== undefined) doctorShift.workDate = updates.workDate;
      if (updates.status !== undefined) doctorShift.status = updates.status;
      if (updates.cancelReason !== undefined) {
        doctorShift.cancelReason = updates.cancelReason;
      }

      await doctorShift.save({ transaction: t });

      return doctorShift;
    }
  );
}
