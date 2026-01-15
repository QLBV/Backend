import Appointment from "../../models/Appointment";
import Shift from "../../models/Shift";
import { BOOKING_CONFIG } from "../../config/booking.config";
import { RoleCode } from "../../constant/role";
import { AppointmentStateMachine } from "../../utils/stateMachine";
import { AppointmentStatus } from "../../constant/appointment";

import { Op, Transaction } from "sequelize";
import { sequelize } from "../../models/index";


function buildAppointmentTime(
  date: string,
  shiftStart: string,
  slotNumber: number
) {
  
  const [hh, mm] = shiftStart.split(":").map(Number);
  const base = new Date(`${date}T00:00:00`);
  base.setHours(hh, mm, 0, 0);

  const minutesToAdd = (slotNumber - 1) * BOOKING_CONFIG.SLOT_MINUTES;
  return new Date(base.getTime() + minutesToAdd * 60 * 1000);
}

export const cancelAppointmentService = async (input: {
  appointmentId: number;
  requesterRole: RoleCode;
  requesterPatientId: number | null;
}) => {
  return await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (t) => {
      
      const appt = await Appointment.findByPk(input.appointmentId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!appt) throw new Error("APPOINTMENT_NOT_FOUND");

      
      AppointmentStateMachine.validateTransition(
        appt.status as AppointmentStatus,
        AppointmentStatus.CANCELLED
      );

      
      if (input.requesterRole === RoleCode.PATIENT) {
        if (
          !input.requesterPatientId ||
          appt.patientId !== input.requesterPatientId
        ) {
          throw new Error("FORBIDDEN");
        }
      }

      
      const shift = await Shift.findByPk(appt.shiftId, { transaction: t });
      if (!shift) throw new Error("SHIFT_NOT_FOUND");

      const appointmentTime = buildAppointmentTime(
        String(appt.date),
        shift.startTime,
        appt.slotNumber
      );
      const cancelDeadline = new Date(
        appointmentTime.getTime() -
          BOOKING_CONFIG.CANCEL_BEFORE_HOURS * 60 * 60 * 1000
      );

      if (new Date() > cancelDeadline) throw new Error("CANCEL_TOO_LATE");

      const currentQueue = appt.queueNumber;

      
      appt.status = AppointmentStatus.CANCELLED;
      appt.queueNumber = null as any; 
      await appt.save({ transaction: t });

      
      if (currentQueue) {
        await Appointment.decrement("queueNumber", {
          where: {
            doctorId: appt.doctorId,
            shiftId: appt.shiftId,
            date: appt.date,
            queueNumber: { [Op.gt]: currentQueue },
            status: { [Op.ne]: "CANCELLED" },
          },
          transaction: t,
        });
      }

      return appt;
    }
  );
};
