import Appointment from "../models/Appointment";
import Shift from "../models/Shift";
import { BOOKING_CONFIG } from "../config/booking.config";
import { RoleCode } from "../constant/role";
import { AppointmentStateMachine } from "../utils/stateMachine";
import { AppointmentStatus } from "../constant/appointment";

function buildAppointmentTime(
  date: string,
  shiftStart: string,
  slotNumber: number
) {
  // date: YYYY-MM-DD, shiftStart: "HH:mm"
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
  const appt = await Appointment.findByPk(input.appointmentId);
  if (!appt) throw new Error("APPOINTMENT_NOT_FOUND");

  // STATE MACHINE: Validate transition from current status to CANCELLED
  AppointmentStateMachine.validateTransition(
    appt.status as AppointmentStatus,
    AppointmentStatus.CANCELLED
  );

  // Patient chỉ hủy lịch của chính mình
  if (input.requesterRole === RoleCode.PATIENT) {
    if (
      !input.requesterPatientId ||
      appt.patientId !== input.requesterPatientId
    ) {
      throw new Error("FORBIDDEN");
    }
  }

  // tính giờ khám = date + shift.startTime + (slot-1)*slotMinutes
  const shift = await Shift.findByPk(appt.shiftId);
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

  // STATE MACHINE: Status transition validated above, now apply it
  appt.status = AppointmentStatus.CANCELLED;
  await appt.save();
  return appt;
};
