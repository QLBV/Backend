import Appointment from "../models/Appointment";
import Visit from "../models/Visit";
import { sequelize } from "../models";
import { createInvoiceService } from "./invoice.service";
import { getPrescriptionByVisitService } from "./prescription.service";

export const checkInAppointmentService = async (appointmentId: number) => {
  return sequelize.transaction(async (t) => {
    const appointment = await Appointment.findByPk(appointmentId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!appointment) throw new Error("APPOINTMENT_NOT_FOUND");
    if (appointment.status !== "WAITING")
      throw new Error("APPOINTMENT_NOT_WAITING");

    const visit = await Visit.create(
      {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
      { transaction: t }
    );

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

  const prescription = await getPrescriptionByVisitService(visitId);
  let total = 0;
  if (prescription && prescription.totalAmount) {
    total += Number(prescription.totalAmount);
  }
  await createInvoiceService({
    appointmentId: visit.appointmentId,
    patientId: visit.patientId,
    doctorId: visit.doctorId,
    total,
    note: `Tự động tạo khi hoàn thành khám bệnh cho Visit #${visit.id}`,
  });

  return visit;
};
