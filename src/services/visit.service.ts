import Appointment from "../models/Appointment";
import Visit from "../models/Visit";
import { sequelize } from "../models";

export const checkInAppointmentService = async (appointmentId: number) => {
  return sequelize.transaction(async (t) => {
    // 1. Check appointment
    const appointment = await Appointment.findByPk(appointmentId, {
      transaction: t,
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");
    if (appointment.status !== "WAITING")
      throw new Error("APPOINTMENT_NOT_WAITING");

    // 2. Tạo visit
    const visit = await Visit.create(
      {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
      { transaction: t }
    );

    // 3. Update appointment
    appointment.status = "CHECKED_IN";
    await appointment.save({ transaction: t });

    return visit;
  });
};

export const completeVisitService = async (
  visitId: number,
  diagnosis: string,
  note?: string
) => {
  const visit = await Visit.findByPk(visitId);
  if (!visit) throw new Error("VISIT_NOT_FOUND");

  if (visit.status === "COMPLETED") throw new Error("VISIT_ALREADY_COMPLETED");

  visit.diagnosis = diagnosis;
  visit.note = note;
  visit.status = "COMPLETED";

  await visit.save();
  return visit;
};
