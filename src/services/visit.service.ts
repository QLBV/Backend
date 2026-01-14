import Appointment from "../models/Appointment";
import Visit from "../models/Visit";
import { sequelize } from "../models";
import { createInvoiceFromVisit } from "./invoice.service";
import { generateVisitCode } from "../utils/codeGenerator";
import { VisitStateMachine } from "../utils/stateMachine";
import { AppointmentStateMachine } from "../utils/stateMachine";
import { AppointmentStatus } from "../constant/appointment";

/**
 * Start examination - Doctor clicks "Khám bệnh" button
 * Updates appointment status from CHECKED_IN to IN_PROGRESS
 */
export const startExaminationService = async (visitId: number) => {
  return await sequelize.transaction(async (t) => {
    // 1. Find visit by ID
    const visit = await Visit.findByPk(visitId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!visit) {
      throw new Error("VISIT_NOT_FOUND");
    }

    // 2. Validate visit status
    // Allow starting examination if status is WAITING or already EXAMINING (idempotent)
    if (visit.status === "EXAMINED" || visit.status === "COMPLETED") {
      throw new Error("VISIT_ALREADY_COMPLETED");
    }

    // Update visit status to EXAMINING if it's currently WAITING
    if (visit.status === "WAITING") {
      visit.status = "EXAMINING";
      await visit.save({ transaction: t });
    }

    // 3. Find and update appointment status
    const appointment = await Appointment.findByPk(visit.appointmentId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // STATE MACHINE: Validate appointment transition to IN_PROGRESS
    // Only attempt transition if not already IN_PROGRESS to avoid errors
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      AppointmentStateMachine.validateTransition(
        appointment.status as AppointmentStatus,
        AppointmentStatus.IN_PROGRESS
      );

      // Update appointment to IN_PROGRESS
      appointment.status = AppointmentStatus.IN_PROGRESS;
      await appointment.save({ transaction: t });
    }

    return visit;
  });
};

export const checkInAppointmentService = async (appointmentId: number) => {
  try {
    return await sequelize.transaction(async (t) => {
      // 1. Check appointment
      const appointment = await Appointment.findByPk(appointmentId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!appointment) {
        throw new Error("APPOINTMENT_NOT_FOUND");
      }

      // STATE MACHINE: Validate appointment transition to CHECKED_IN
      AppointmentStateMachine.validateTransition(
        appointment.status as AppointmentStatus,
        AppointmentStatus.CHECKED_IN
      );

      // CRITICAL: Validate appointment date - prevent check-in for old appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate < yesterday) {
        throw new Error("APPOINTMENT_TOO_OLD_TO_CHECK_IN");
      }

      // 2. Check if visit already exists for this appointment
      const existingVisit = await Visit.findOne({
        where: { appointmentId: appointment.id },
        transaction: t,
      });

      if (existingVisit) {
        throw new Error("APPOINTMENT_ALREADY_CHECKED_IN");
      }

      // 3. Generate visit code
      const visitCode = await generateVisitCode();

      // 4. Tạo visit
      const visit = await Visit.create(
        {
          visitCode,
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        },
        { transaction: t }
      );

      // 5. Update appointment (transition already validated above)
      appointment.status = AppointmentStatus.CHECKED_IN;
      await appointment.save({ transaction: t });

      return visit;
    });
  } catch (error: any) {
    // Log error for debugging
    console.error("Error in checkInAppointmentService:", {
      appointmentId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export const completeVisitService = async (
  visitId: number,
  diagnosis: string,
  examinationFee: number,
  createdBy: number,
  note?: string,
  vitalSigns?: any
) => {
  return sequelize.transaction(async (t) => {
    // 1. Lấy visit
    const visit = await Visit.findByPk(visitId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!visit) throw new Error("VISIT_NOT_FOUND");

    // CRITICAL: STATE MACHINE - Enforce immutable rule
    VisitStateMachine.validateNotCompleted(visit.status);

    // STATE MACHINE: Validate visit transition to EXAMINED
    VisitStateMachine.validateTransition(visit.status, "EXAMINED");

    // 2. Cập nhật visit với doctor signature
    visit.diagnosis = diagnosis;
    visit.note = note;
    if (vitalSigns) {
      visit.vitalSigns = vitalSigns;
    }
    // Mark as EXAMINED after doctor saves examination
    visit.status = "EXAMINED";

    // COMPLIANCE: Generate doctor signature (hash of key fields)
    // This creates an audit trail that diagnosis was approved by the doctor
    const crypto = require("crypto");
    const signatureData = {
      visitId: visit.id,
      doctorId: visit.doctorId,
      patientId: visit.patientId,
      diagnosis,
      vitalSigns: visit.vitalSigns,
      timestamp: new Date().toISOString(),
    };
    visit.doctorSignature = crypto
      .createHash("sha256")
      .update(JSON.stringify(signatureData))
      .digest("hex");
    visit.signedAt = new Date();

    await visit.save({ transaction: t });

    // 3. Keep appointment in progress; completion happens after payment
    const appointment = await Appointment.findByPk(visit.appointmentId, { transaction: t });
    if (appointment) {
      console.log("[completeVisit] Before update:", {
        appointmentId: appointment.id,
        currentStatus: appointment.status,
        willChangeTo: appointment.status,
      });

      // Ensure appointment is in progress; auto-bump from CHECKED_IN if needed
      let appointmentChanged = false;
      if (appointment.status === "CHECKED_IN") {
        // STATE MACHINE: Validate transition before auto-bump
        AppointmentStateMachine.validateTransition(
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_PROGRESS
        );
        appointment.status = AppointmentStatus.IN_PROGRESS;
        appointmentChanged = true;
      } else if (appointment.status !== "IN_PROGRESS") {
        throw new Error("APPOINTMENT_NOT_IN_PROGRESS");
      }

      // Keep appointment in progress until payment is completed
      if (appointmentChanged) {
        await appointment.save({ transaction: t });
      }

      console.log("[completeVisit] After update:", {
        appointmentId: appointment.id,
        savedStatus: appointment.status,
      });
    } else {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    // 4. Tự động tạo invoice
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
