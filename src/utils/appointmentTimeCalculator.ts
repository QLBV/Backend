import { BOOKING_CONFIG } from "../config/booking.config";


export function calculateAppointmentTime(
  startTime: string,
  slotNumber: number
): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes =
    hours * 60 + minutes + (slotNumber - 1) * BOOKING_CONFIG.SLOT_MINUTES;
  const appointmentHours = Math.floor(totalMinutes / 60);
  const appointmentMinutes = totalMinutes % 60;

  return `${String(appointmentHours).padStart(2, "0")}:${String(appointmentMinutes).padStart(2, "0")}`;
}


export function formatShiftTime(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}
