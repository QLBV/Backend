import Appointment from "../../models/Appointment";
import Visit from "../../models/Visit";
import { sequelize } from "../../models/index";
import { createInvoiceFromVisit } from "../finance/invoice.service";
import { generateVisitCode } from "../../utils/codeGenerator";
import { VisitStateMachine } from "../../utils/stateMachine";
import { AppointmentStateMachine } from "../../utils/stateMachine";
import { AppointmentStatus } from "../../constant/appointment";


export const startExaminationService = async (visitId: number) => {
  return await sequelize.transaction(async (t) => {
    
    const visit = await Visit.findByPk(visitId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!visit) {
      throw new Error("VISIT_NOT_FOUND");
    }

    
    
    if (visit.status === "EXAMINED" || visit.status === "COMPLETED") {
      throw new Error("VISIT_ALREADY_COMPLETED");
    }

    
    if (visit.status === "WAITING") {
      visit.status = "EXAMINING";
      await visit.save({ transaction: t });
    }

    
    const appointment = await Appointment.findByPk(visit.appointmentId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!appointment) {
      throw new Error("APPOINTMENT_NOT_FOUND");
    }

    
    
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      AppointmentStateMachine.validateTransition(
        appointment.status as AppointmentStatus,
        AppointmentStatus.IN_PROGRESS
      );

      
      appointment.status = AppointmentStatus.IN_PROGRESS;
      await appointment.save({ transaction: t });
    }

    return visit;
  });
};

export const checkInAppointmentService = async (appointmentId: number) => {
  try {
    return await sequelize.transaction(async (t) => {
      
      const appointment = await Appointment.findByPk(appointmentId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!appointment) {
        throw new Error("APPOINTMENT_NOT_FOUND");
      }

      
      AppointmentStateMachine.validateTransition(
        appointment.status as AppointmentStatus,
        AppointmentStatus.CHECKED_IN
      );

      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate < yesterday) {
        throw new Error("APPOINTMENT_TOO_OLD_TO_CHECK_IN");
      }

      
      const existingVisit = await Visit.findOne({
        where: { appointmentId: appointment.id },
        transaction: t,
      });

      if (existingVisit) {
        throw new Error("APPOINTMENT_ALREADY_CHECKED_IN");
      }

      
      const visitCode = await generateVisitCode();

      
      const visit = await Visit.create(
        {
          visitCode,
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        },
        { transaction: t }
      );

      
      appointment.status = AppointmentStatus.CHECKED_IN;
      await appointment.save({ transaction: t });

      return visit;
    });
  } catch (error: any) {
    
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
    
    const visit = await Visit.findByPk(visitId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!visit) throw new Error("VISIT_NOT_FOUND");

    
    VisitStateMachine.validateNotCompleted(visit.status);

    
    VisitStateMachine.validateTransition(visit.status, "EXAMINED");

    
    visit.diagnosis = diagnosis;
    visit.note = note;
    if (vitalSigns) {
      visit.vitalSigns = vitalSigns;
    }
    
    visit.status = "EXAMINED";

    
    
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

    
    const appointment = await Appointment.findByPk(visit.appointmentId, {
      transaction: t,
    });
    if (appointment) {
      console.log("[completeVisit] Before update:", {
        appointmentId: appointment.id,
        currentStatus: appointment.status,
        willChangeTo: appointment.status,
      });

      
      let appointmentChanged = false;
      if (appointment.status === "CHECKED_IN") {
        
        AppointmentStateMachine.validateTransition(
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_PROGRESS
        );
        appointment.status = AppointmentStatus.IN_PROGRESS;
        appointmentChanged = true;
      } else if (appointment.status !== "IN_PROGRESS") {
        throw new Error("APPOINTMENT_NOT_IN_PROGRESS");
      }

      
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
      
      
      console.error("Failed to auto-create invoice:", error.message);
      return {
        visit,
        invoice: null,
        invoiceError: error.message,
      };
    }
  });
};
