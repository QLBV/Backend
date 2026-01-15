/**
 * Status Mapper Utility
 *
 * Provides unified status display logic across all roles (Doctor, Receptionist, Patient, Admin)
 * Handles the mapping between Appointment.status and Visit.status to show consistent status information
 */

import { VisitStatus } from "../models/Visit";

interface AppointmentLike {
  status: "WAITING" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

interface VisitLike {
  status: VisitStatus;
}

/**
 * Get display status for an appointment, optionally considering visit status
 *
 * @param appointment - The appointment object
 * @param visit - Optional visit object (if appointment has been checked in)
 * @returns Display status string in Vietnamese
 */
export function getDisplayStatus(
  appointment: AppointmentLike,
  visit?: VisitLike | null
): string {
  // If visit exists, prioritize visit status for medical context
  if (visit) {
    if (visit.status === "COMPLETED") return "HOÀN THÀNH";
    if (visit.status === "EXAMINED") return "ĐÃ KHÁM";
    if (visit.status === "EXAMINING" && appointment.status === "IN_PROGRESS") return "ĐANG KHÁM";
    if (visit.status === "EXAMINING" && appointment.status === "CHECKED_IN") return "CHỜ KHÁM";
  }

  // Fall back to appointment status
  if (appointment.status === "WAITING") return "CHỜ CHECKIN";
  if (appointment.status === "CHECKED_IN") return "CHỜ KHÁM";
  if (appointment.status === "IN_PROGRESS") return "ĐANG KHÁM";
  if (appointment.status === "COMPLETED") return "HOÀN THÀNH";
  if (appointment.status === "CANCELLED") return "ĐÃ HỦY";
  if (appointment.status === "NO_SHOW") return "VẮNG MẶT";

  return appointment.status;
}

/**
 * Get raw status enum value (for filtering/queries)
 *
 * @param displayStatus - Display status in Vietnamese
 * @returns Raw status enum value
 */
export function getRawStatus(displayStatus: string): string | null {
  const mapping: Record<string, string> = {
    "CHỜ CHECKIN": "WAITING",
    "CHỜ KHÁM": "CHECKED_IN",
    "ĐANG KHÁM": "IN_PROGRESS",
    "ĐÃ KHÁM": "IN_PROGRESS", // examined but not paid
    "HOÀN THÀNH": "COMPLETED",
    "ĐÃ HỦY": "CANCELLED",
    "VẮNG MẶT": "NO_SHOW",
  };

  return mapping[displayStatus] || null;
}

/**
 * Get status color for UI display
 *
 * @param displayStatus - Display status in Vietnamese
 * @returns Color code for UI
 */
export function getStatusColor(displayStatus: string): string {
  const colorMap: Record<string, string> = {
    "CHỜ CHECKIN": "yellow",
    "CHỜ KHÁM": "blue",
    "ĐANG KHÁM": "orange",
    "ĐÃ KHÁM": "green",
    "HOÀN THÀNH": "green",
    "ĐÃ HỦY": "red",
    "VẮNG MẶT": "gray",
  };

  return colorMap[displayStatus] || "gray";
}
