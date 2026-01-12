import { Transaction } from "sequelize";
import { sequelize } from "../models";
import DoctorShift, { DoctorShiftStatus } from "../models/DoctorShift";
import Shift from "../models/Shift";
import Doctor from "../models/Doctor";
import { AppError } from "../utils/AppError";

/**
 * Check if two time ranges overlap
 * Works for HH:MM string format (e.g., "08:00", "14:30")
 * Lexicographic comparison works correctly for this format
 *
 * @param start1 Start time of first range (HH:MM)
 * @param end1 End time of first range (HH:MM)
 * @param start2 Start time of second range (HH:MM)
 * @param end2 End time of second range (HH:MM)
 * @returns true if the time ranges overlap, false otherwise
 *
 * @example
 * checkTimeOverlap("08:00", "12:00", "10:00", "14:00") // true (overlaps 10:00-12:00)
 * checkTimeOverlap("08:00", "12:00", "13:00", "17:00") // false (no overlap)
 */
export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Overlap if: start1 < end2 AND start2 < end1
  // This is the standard algorithm for checking if two intervals overlap
  return start1 < end2 && start2 < end1;
}

/**
 * Validate that a doctor doesn't already have an overlapping shift on the given date
 *
 * @param doctorId The doctor ID
 * @param shiftId The shift ID to assign
 * @param workDate The work date (YYYY-MM-DD)
 * @param transaction The database transaction
 * @throws AppError if doctor already has an overlapping shift on this date
 */
export async function validateNoOverlappingShifts(
  doctorId: number,
  shiftId: number,
  workDate: string,
  transaction: Transaction
): Promise<void> {
  // 1. Get the shift being assigned
  const newShift = await Shift.findByPk(shiftId, { transaction });
  if (!newShift) {
    throw new AppError("SHIFT_NOT_FOUND", "Shift not found", 404);
  }

  // 2. Get all ACTIVE shifts for this doctor on this date
  // We lock these rows to prevent race conditions during concurrent assignments
  const existingShifts = await DoctorShift.findAll({
    where: {
      doctorId,
      workDate,
      status: DoctorShiftStatus.ACTIVE, // Only check active shifts, ignore cancelled/replaced
    },
    include: [
      {
        model: Shift,
        as: "shift",
        attributes: ["id", "name", "startTime", "endTime"],
      },
    ],
    transaction,
    lock: transaction.LOCK.UPDATE, // Pessimistic lock to serialize concurrent assignments
  });

  // 3. Check if any existing shift overlaps with the new shift
  for (const existing of existingShifts) {
    const existingShift = existing.shift;
    if (!existingShift) continue;

    // Skip if it's the same shift (for update scenarios)
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

/**
 * Assign a doctor to a shift on a specific date
 * This is a transactional service that validates:
 * - Doctor exists and is active
 * - Shift exists
 * - No overlapping shifts for the doctor on this date
 *
 * @param doctorId The doctor ID
 * @param shiftId The shift ID
 * @param workDate The work date (YYYY-MM-DD format)
 * @returns The created DoctorShift record
 * @throws AppError if validation fails
 */
export async function assignDoctorToShiftService(
  doctorId: number,
  shiftId: number,
  workDate: string
): Promise<DoctorShift> {
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      // 1. Validate doctor exists and is active
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

      // 2. Validate no overlapping shifts
      await validateNoOverlappingShifts(doctorId, shiftId, workDate, t);

      // 3. Create the doctor shift assignment
      const doctorShift = await DoctorShift.create(
        {
          doctorId,
          shiftId,
          workDate,
          status: DoctorShiftStatus.ACTIVE,
        },
        { transaction: t }
      );

      return doctorShift;
    }
  );
}

/**
 * Update a doctor shift assignment
 * If shiftId or workDate is changed, validates no overlapping shifts
 *
 * @param id The DoctorShift ID
 * @param updates Object containing fields to update
 * @returns The updated DoctorShift record
 * @throws AppError if validation fails
 */
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
      // 1. Lock the doctor shift row
      const doctorShift = await DoctorShift.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!doctorShift) {
        throw new AppError("DOCTOR_SHIFT_NOT_FOUND", "Doctor shift not found", 404);
      }

      // 2. Check if shift or date is being changed
      const isShiftChanged = updates.shiftId !== undefined && updates.shiftId !== doctorShift.shiftId;
      const isDateChanged = updates.workDate !== undefined && updates.workDate !== doctorShift.workDate;

      // 3. If shift or date changed, validate no overlaps
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

      // 4. Apply updates
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
