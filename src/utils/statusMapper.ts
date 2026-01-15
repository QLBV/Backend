

import { VisitStatus } from "../models/Visit";

interface AppointmentLike {
  status: "WAITING" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

interface VisitLike {
  status: VisitStatus;
}


export function getDisplayStatus(
  appointment: AppointmentLike,
  visit?: VisitLike | null
): string {
  
  if (visit) {
    if (visit.status === "COMPLETED") return "HOÀN THÀNH";
    if (visit.status === "EXAMINED") return "ĐÃ KHÁM";
    if (visit.status === "EXAMINING" && appointment.status === "IN_PROGRESS") return "ĐANG KHÁM";
    if (visit.status === "EXAMINING" && appointment.status === "CHECKED_IN") return "CHỜ KHÁM";
  }

  
  if (appointment.status === "WAITING") return "CHỜ CHECKIN";
  if (appointment.status === "CHECKED_IN") return "CHỜ KHÁM";
  if (appointment.status === "IN_PROGRESS") return "ĐANG KHÁM";
  if (appointment.status === "COMPLETED") return "HOÀN THÀNH";
  if (appointment.status === "CANCELLED") return "ĐÃ HỦY";
  if (appointment.status === "NO_SHOW") return "VẮNG MẶT";

  return appointment.status;
}


export function getRawStatus(displayStatus: string): string | null {
  const mapping: Record<string, string> = {
    "CHỜ CHECKIN": "WAITING",
    "CHỜ KHÁM": "CHECKED_IN",
    "ĐANG KHÁM": "IN_PROGRESS",
    "ĐÃ KHÁM": "IN_PROGRESS", 
    "HOÀN THÀNH": "COMPLETED",
    "ĐÃ HỦY": "CANCELLED",
    "VẮNG MẶT": "NO_SHOW",
  };

  return mapping[displayStatus] || null;
}


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
