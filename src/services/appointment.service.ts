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
  patientName?: string;
  patientPhone?: string;
  patientDob?: string;
  patientGender?: "MALE" | "FEMALE" | "OTHER";
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
    patientName,
    patientPhone,
    patientDob,
    patientGender,
  } = input;

  // Dùng Transaction để đảm bảo tính nhất quán dữ liệu khi có nhiều người đặt cùng lúc
  // Neu loi ở bất kỳ bước nào thì hủy toàn bộ, không lưu dữ liệu nửa chừng
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      //  Basic Validations
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
        console.warn(
          `Patient ${patientId} has high no-show count: ${patient.noShowCount}`
        );
      }

      // Lock DoctorShift row (xếp hàng đặt lịch theo ca)
      const ds = await DoctorShift.findOne({
        where: { doctorId, shiftId, workDate: date },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!ds) throw new Error("DOCTOR_NOT_ON_DUTY");

      //  Check real-time validation for today's appointments
      if (date === today) {
        // Get shift details to check end time
        const Shift = (await import("../models/Shift")).default;
        const shift = await Shift.findByPk(shiftId, { transaction: t });
        
        if (shift) {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
          
          // If shift has already ended, cannot book
          if (currentTime >= shift.endTime) {
            throw new Error("SHIFT_ALREADY_ENDED");
          }
          
          console.log(`⏰ Real-time check: Current time ${currentTime}, Shift ends at ${shift.endTime}`);
        }
      }

      const effectiveMaxSlots =
        ds.maxSlots || BOOKING_CONFIG.MAX_SLOTS_PER_SHIFT;

      // Validate patient không book nhiều slot overlap
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

          // Get name to compare (account holder's name if null)
          const existingName = existingAppt.patientName || patient?.fullName;
          const currentName = patientName || patient?.fullName;

          // Normalize names for comparison
          const nExisting = existingName?.trim().toLowerCase();
          const nCurrent = currentName?.trim().toLowerCase();

          // If names are different, it means booking for a relative/different person
          // So we ALLOW overlap (skip the check)
          if (nExisting && nCurrent && nExisting !== nCurrent) {
            continue;
          }

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

      // Lấy slot cuối của ca (lock row thật)
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
      if (nextSlot > effectiveMaxSlots) throw new Error("SHIFT_FULL");

      // Validate appointment time doesn't exceed shift end time
      const Shift = (await import("../models/Shift")).default;
      const shift = await Shift.findByPk(shiftId, { transaction: t });
      
      if (shift) {
        // Calculate expected appointment time
        // Each slot is 15 minutes apart, starting from shift start time
        const SLOT_DURATION_MINUTES = 15;
        const CONSULTATION_DURATION_MINUTES = 30; // Average consultation time
        
        // Parse shift start time (e.g., "14:00:00")
        const [startHour, startMinute] = shift.startTime.split(":").map(Number);
        const shiftStartMinutes = startHour * 60 + startMinute;
        
        // Calculate appointment start time
        const appointmentStartMinutes = shiftStartMinutes + (nextSlot - 1) * SLOT_DURATION_MINUTES;
        
        // Calculate appointment end time (start + consultation duration)
        const appointmentEndMinutes = appointmentStartMinutes + CONSULTATION_DURATION_MINUTES;
        
        // Parse shift end time
        const [endHour, endMinute] = shift.endTime.split(":").map(Number);
        const shiftEndMinutes = endHour * 60 + endMinute;
        
        // Check if appointment would exceed shift end time
        if (appointmentEndMinutes > shiftEndMinutes) {
          const appointmentEndTime = `${String(Math.floor(appointmentEndMinutes / 60)).padStart(2, "0")}:${String(appointmentEndMinutes % 60).padStart(2, "0")}`;
          console.log(`⚠️  Slot ${nextSlot} would end at ${appointmentEndTime}, but shift ends at ${shift.endTime}`);
          throw new Error("APPOINTMENT_EXCEEDS_SHIFT_TIME");
        }
        
        console.log(`✅ Slot ${nextSlot} validation passed: Appointment will end before ${shift.endTime}`);
      }

      // Generate appointment code
      const appointmentCode = await generateAppointmentCode();

      // Create + retry nếu đụng unique slot
      while (nextSlot <= effectiveMaxSlots) {
        try {

          // Calculate queue number based on last appointment
          // Fallback to slotNumber for existing data migration
          const lastQueueNumber = last?.queueNumber ?? last?.slotNumber ?? 0;
          
          const appt = await Appointment.create(
            {
              appointmentCode,
              patientId,
              doctorId,
              shiftId,
              date,
              slotNumber: nextSlot,
              queueNumber: lastQueueNumber + 1,
              bookingType,
              bookedBy,
              symptomInitial,
              patientName,
              patientPhone,
              patientDob,
              patientGender,
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
