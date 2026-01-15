import { Op, Transaction } from "sequelize";
import Appointment from "../../models/Appointment";
import DoctorShift from "../../models/DoctorShift";
import Doctor from "../../models/Doctor";
import Patient from "../../models/Patient";
import { sequelize } from "../../models/index";
import { BOOKING_CONFIG } from "../../config/booking.config";
import { generateAppointmentCode } from "../../utils/codeGenerator";

interface CreateAppointmentInput {
  patientId: number;
  doctorId: number;
  shiftId: number;
  date: string; 
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

  
  
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      
      const today = new Date().toLocaleDateString("en-CA");
      if (date < today) {
        throw new Error("CANNOT_BOOK_PAST_DATE");
      }

      
      const doctor = await Doctor.findByPk(doctorId, { transaction: t });
      if (!doctor || !doctor.isActive) {
        throw new Error("DOCTOR_NOT_AVAILABLE");
      }

      
      const patient = await Patient.findByPk(patientId, { transaction: t });
      if (patient && (patient.noShowCount || 0) >= 3) {
        
        
        console.warn(
          `Patient ${patientId} has high no-show count: ${patient.noShowCount}`
        );
      }

      
      const ds = await DoctorShift.findOne({
        where: { doctorId, shiftId, workDate: date },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!ds) throw new Error("DOCTOR_NOT_ON_DUTY");

      
      if (date === today) {
        
        const Shift = (await import("../../models/Shift")).default;
        const shift = await Shift.findByPk(shiftId, { transaction: t });
        
        if (shift) {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
          
          
          if (currentTime >= shift.endTime) {
            throw new Error("SHIFT_ALREADY_ENDED");
          }
          
          console.log(`⏰ Real-time check: Current time ${currentTime}, Shift ends at ${shift.endTime}`);
        }
      }

      const effectiveMaxSlots =
        ds.maxSlots || BOOKING_CONFIG.MAX_SLOTS_PER_SHIFT;

      
      
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
            model: (await import("../../models/Shift")).default,
            as: "shift",
            attributes: ["startTime", "endTime"],
          },
        ],
        transaction: t,
      });

      if (patientAppointments.length > 0) {
        
        const currentShift = await (
          await import("../../models/Shift")
        ).default.findByPk(shiftId, { transaction: t });
        if (!currentShift) throw new Error("SHIFT_NOT_FOUND");

        
        for (const existingAppt of patientAppointments) {
          const existingShift = (existingAppt as any).shift;
          if (!existingShift) continue;

          
          const existingName = existingAppt.patientName || patient?.fullName;
          const currentName = patientName || patient?.fullName;

          
          const nExisting = existingName?.trim().toLowerCase();
          const nCurrent = currentName?.trim().toLowerCase();

          
          
          if (nExisting && nCurrent && nExisting !== nCurrent) {
            continue;
          }

          
          const currentStart = currentShift.startTime;
          const currentEnd = currentShift.endTime;
          const existingStart = existingShift.startTime;
          const existingEnd = existingShift.endTime;

          if (currentStart < existingEnd && existingStart < currentEnd) {
            throw new Error("PATIENT_ALREADY_HAS_OVERLAPPING_APPOINTMENT");
          }
        }
      }

      
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

      
      const Shift = (await import("../../models/Shift")).default;
      const shift = await Shift.findByPk(shiftId, { transaction: t });
      
      if (shift) {
        
        
        const SLOT_DURATION_MINUTES = 15;
        const CONSULTATION_DURATION_MINUTES = 30; 
        
        
        const [startHour, startMinute] = shift.startTime.split(":").map(Number);
        const shiftStartMinutes = startHour * 60 + startMinute;
        
        
        const appointmentStartMinutes = shiftStartMinutes + (nextSlot - 1) * SLOT_DURATION_MINUTES;
        
        
        const appointmentEndMinutes = appointmentStartMinutes + CONSULTATION_DURATION_MINUTES;
        
        
        const [endHour, endMinute] = shift.endTime.split(":").map(Number);
        const shiftEndMinutes = endHour * 60 + endMinute;
        
        
        if (appointmentEndMinutes > shiftEndMinutes) {
          const appointmentEndTime = `${String(Math.floor(appointmentEndMinutes / 60)).padStart(2, "0")}:${String(appointmentEndMinutes % 60).padStart(2, "0")}`;
          console.log(`️  Slot ${nextSlot} would end at ${appointmentEndTime}, but shift ends at ${shift.endTime}`);
          throw new Error("APPOINTMENT_EXCEEDS_SHIFT_TIME");
        }
        
        console.log(` Slot ${nextSlot} validation passed: Appointment will end before ${shift.endTime}`);
      }

      
      const appointmentCode = await generateAppointmentCode();

      
      while (nextSlot <= effectiveMaxSlots) {
        try {

          
          
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
