import { BOOKING_CONFIG } from "../config/booking.config";

/**
 * Tính giờ khám dự kiến dựa trên startTime của ca và slotNumber
 * @param startTime - Giờ bắt đầu ca (format: "HH:MM")
 * @param slotNumber - Số thứ tự slot
 * @returns Giờ khám dự kiến (format: "HH:MM")
 *
 * @example
 * calculateAppointmentTime("08:00", 1) // "08:00"
 * calculateAppointmentTime("08:00", 2) // "08:10"
 * calculateAppointmentTime("08:00", 3) // "08:20"
 * calculateAppointmentTime("13:30", 5) // "14:10"
 */
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

/**
 * Format thời gian ca khám
 * @param startTime - Giờ bắt đầu ca
 * @param endTime - Giờ kết thúc ca
 * @returns Khoảng thời gian (format: "HH:MM - HH:MM")
 */
export function formatShiftTime(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}
