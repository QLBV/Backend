import Appointment from "../models/Appointment";
import Visit from "../models/Visit";
import { sequelize } from "../models";
import { createInvoiceFromVisit } from "./invoice.service";

export const checkInAppointmentService = async (appointmentId: number) => {
  return sequelize.transaction(async (t) => {
    // 1. Check appointment
    const appointment = await Appointment.findByPk(appointmentId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
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
  examinationFee: number,
  createdBy: number,
  note?: string
) => {
  return sequelize.transaction(async (t) => {
    // 1. Lấy visit
    const visit = await Visit.findByPk(visitId, { transaction: t });
    if (!visit) throw new Error("VISIT_NOT_FOUND");

    if (visit.status === "COMPLETED")
      throw new Error("VISIT_ALREADY_COMPLETED");

    // 2. Cập nhật visit
    visit.diagnosis = diagnosis;
    visit.note = note;
    visit.status = "COMPLETED";
    await visit.save({ transaction: t });

    // 3. Tự động tạo invoice
    try {
      const invoice = await createInvoiceFromVisit(
        visitId,
        createdBy,
        examinationFee,
        t
      );

      return {
        visit,
        invoice,
      };
    } catch (error: any) {
      // Nếu tạo invoice thất bại, vẫn cho phép complete visit
      // nhưng log error
      console.error("Failed to auto-create invoice:", error.message);
      return {
        visit,
        invoice: null,
        invoiceError: error.message,
      };
    }
  });
};
