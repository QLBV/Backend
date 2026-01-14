import { Op, Transaction } from "sequelize";
import Appointment from "../models/Appointment";
import DoctorShift from "../models/DoctorShift";
import Doctor from "../models/Doctor";
import Patient from "../models/Patient";
import { sequelize } from "../models";
import { BOOKING_CONFIG } from "../config/booking.config";
import { generateAppointmentCode } from "../utils/codeGenerator";

interface CreateAppointmentInput {
  patientId: number;
  doctorId: number;
  shiftId: number;
  date: string; // YYYY-MM-DD
  bookingType: "ONLINE" | "OFFLINE";
  bookedBy: "PATIENT" | "RECEPTIONIST";
  symptomInitial?: string;
}

export const createAppointmentService = async (
  input: CreateAppointmentInput
) => {
  const {
    patientId,
    doctorId,
    shiftId,
    date,
    bookingType,
    bookedBy,
    symptomInitial,
  } = input;

  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      // 0) Basic Validations
      const today = new Date().toLocaleDateString("en-CA");
      if (date < today) {
        throw new Error("CANNOT_BOOK_PAST_DATE");
      }

      // Check doctor active status
      const doctor = await Doctor.findByPk(doctorId, { transaction: t });
      if (!doctor || !doctor.isActive) {
        throw new Error("DOCTOR_NOT_AVAILABLE");
      }

      // Check patient no-show policy
      const patient = await Patient.findByPk(patientId, { transaction: t });
      if (patient && (patient.noShowCount || 0) >= 3) {
         // Optionally block if they have too many no-shows
         // throw new Error("PATIENT_BLOCKED_DUE_TO_NO_SHOWS");
         console.warn(`Patient ${patientId} has high no-show count: ${patient.noShowCount}`);
      }

      // 1) Lock DoctorShift row (xếp hàng đặt lịch theo ca)
      const ds = await DoctorShift.findOne({
        where: { doctorId, shiftId, workDate: date },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!ds) throw new Error("DOCTOR_NOT_ON_DUTY");

      // 2) CRITICAL: Validate patient không book nhiều slot overlap
      // Kiểm tra patient không có appointment khác cùng ngày với status WAITING/CHECKED_IN/IN_PROGRESS
      const patientAppointments = await Appointment.findAll({
        where: {
          patientId,
          date,
          status: {
            [Op.in]: ["WAITING", "CHECKED_IN", "IN_PROGRESS"],
          },
        },
        include: [
          {
            model: (await import("../models/Shift")).default,
            as: "shift",
            attributes: ["startTime", "endTime"],
          },
        ],
        transaction: t,
      });

      if (patientAppointments.length > 0) {
        // Get current shift time
        const currentShift = await (
          await import("../models/Shift")
        ).default.findByPk(shiftId, { transaction: t });
        if (!currentShift) throw new Error("SHIFT_NOT_FOUND");

        // Check for time overlap
        for (const existingAppt of patientAppointments) {
          const existingShift = (existingAppt as any).shift;
          if (!existingShift) continue;

          // Simple overlap check: if shifts overlap, appointments overlap
          // Shift A: [startA, endA], Shift B: [startB, endB]
          // Overlap if: startA < endB AND startB < endA
          const currentStart = currentShift.startTime;
          const currentEnd = currentShift.endTime;
          const existingStart = existingShift.startTime;
          const existingEnd = existingShift.endTime;

          if (currentStart < existingEnd && existingStart < currentEnd) {
            throw new Error("PATIENT_ALREADY_HAS_OVERLAPPING_APPOINTMENT");
          }
        }
      }

      // 3) Giới hạn 40 lịch / ngày (tất cả ca)
      // Note: Appointment.count() doesn't support pessimistic lock in Sequelize.
      // However, the DoctorShift lock on line 60 serializes all bookings for this shift,
      // which prevents race conditions in practice. For additional safety, a database
      // CHECK constraint should be added (see migration 20260113000001).
      const dayCount = await Appointment.count({
        where: {
          doctorId,
          date,
          status: { [Op.ne]: "CANCELLED" },
        },
        transaction: t,
      });
      if (dayCount >= BOOKING_CONFIG.MAX_APPOINTMENTS_PER_DAY)
        throw new Error("DAY_FULL");

      // 4) Lấy slot cuối của ca (lock row thật)
      const last = await Appointment.findOne({
        where: {
          doctorId,
          shiftId,
          date,
          status: { [Op.ne]: "CANCELLED" },
        },
        order: [["slotNumber", "DESC"]],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      let nextSlot = last ? Number(last.slotNumber) + 1 : 1;
      if (nextSlot > BOOKING_CONFIG.MAX_SLOTS_PER_SHIFT)
        throw new Error("SHIFT_FULL");

      // 5) Generate appointment code
      const appointmentCode = await generateAppointmentCode();

      // 6) Create + retry nếu đụng unique slot
      while (nextSlot <= BOOKING_CONFIG.MAX_SLOTS_PER_SHIFT) {
        try {
          const appt = await Appointment.create(
            {
              appointmentCode,
              patientId,
              doctorId,
              shiftId,
              date,
              slotNumber: nextSlot,
              bookingType,
              bookedBy,
              symptomInitial,
              status: "WAITING",
            },
            { transaction: t }
          );
          return appt;
        } catch (err: any) {
          if (err?.name === "SequelizeUniqueConstraintError") {
            nextSlot += 1;
            continue;
          }
          throw err;
        }
      }

      throw new Error("SHIFT_FULL");
    }
  );
};
