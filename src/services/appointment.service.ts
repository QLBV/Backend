import { Op, Transaction } from "sequelize";
import Appointment from "../models/Appointment";
import DoctorShift from "../models/DoctorShift";
import { sequelize } from "../models";
import { BOOKING_CONFIG } from "../config/booking.config";
import { generateAppointmentCode } from "../utils/codeGenerator";
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
      // 1) Lock DoctorShift row (xếp hàng đặt lịch theo ca)
      const ds = await DoctorShift.findOne({
        where: { doctorId, shiftId, workDate: date },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!ds) throw new Error("DOCTOR_NOT_ON_DUTY");

      // 2) Giới hạn 40 lịch / ngày (tất cả ca)
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

      // 3) Lấy slot cuối của ca (lock row thật)
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

      // 4) Generate appointment code
      const appointmentCode = await generateAppointmentCode();

      // 5) Create + retry nếu đụng unique slot
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
