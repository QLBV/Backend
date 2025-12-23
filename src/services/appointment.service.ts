import Appointment from "../models/Appointment";
import DoctorShift from "../models/DoctorShift";
import { Op } from "sequelize";

const MAX_SLOT_PER_DAY = 40;

export const createAppointmentService = async ({
  patientId,
  doctorId,
  shiftId,
  date,
  bookingType,
  bookedBy,
  symptomInitial,
}: any) => {
  // 1️⃣ Check bác sĩ có trực ca đó không
  const onDuty = await DoctorShift.findOne({
    where: { doctorId, shiftId, workDate: date },
  });
  if (!onDuty) throw new Error("DOCTOR_NOT_ON_DUTY");

  // 2️⃣ Đếm slot đã dùng
  const count = await Appointment.count({
    where: { doctorId, shiftId, date },
  });
  if (count >= MAX_SLOT_PER_DAY) throw new Error("SHIFT_FULL");

  // 3️⃣ Slot tiếp theo
  const slotNumber = count + 1;

  // 4️⃣ Tạo appointment
  return Appointment.create({
    patientId,
    doctorId,
    shiftId,
    date,
    slotNumber,
    bookingType,
    bookedBy,
    symptomInitial,
  });
};
