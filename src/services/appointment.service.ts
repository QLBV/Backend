import { Op, Transaction } from "sequelize";
import Appointment from "../models/Appointment";
import DoctorShift from "../models/DoctorShift";
import { sequelize } from "../models";
import { BOOKING_CONFIG } from "../config/booking.config";

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

  // =========================
  // 1️⃣ Kiểm tra bác sĩ có trực ca đó không
  // =========================
  const doctorShift = await DoctorShift.findOne({
    where: {
      doctorId,
      shiftId,
      workDate: date,
    },
  });

  if (!doctorShift) {
    throw new Error("DOCTOR_NOT_ON_DUTY");
  }

  // =========================
  // 2️⃣ Transaction chống race-condition
  // =========================
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async (t) => {
      // =========================
      // 3️⃣ Đếm số lịch đã đặt
      // =========================
      const count = await Appointment.count({
        where: {
          doctorId,
          shiftId,
          date,
          status: {
            [Op.ne]: "CANCELLED",
          },
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (count >= BOOKING_CONFIG.MAX_SLOTS_PER_SHIFT) {
        throw new Error("SHIFT_FULL");
      }

      // =========================
      // 4️⃣ Tìm slotNumber tiếp theo
      // =========================
      const lastSlot = await Appointment.max("slotNumber", {
        where: { doctorId, shiftId, date },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const nextSlot = lastSlot ? Number(lastSlot) + 1 : 1;

      if (nextSlot > BOOKING_CONFIG.MAX_SLOTS_PER_SHIFT) {
        throw new Error("SHIFT_FULL");
      }

      // =========================
      // 5️⃣ Tạo appointment
      // =========================
      const appointment = await Appointment.create(
        {
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

      return appointment;
    }
  );
};
