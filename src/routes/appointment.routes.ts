import { Router } from "express";
import {
  createAppointment,
  cancelAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  getMyAppointments,
  getUpcomingAppointments,
  markNoShow,
} from "../controllers/appointment.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { requirePatientContext } from "../middlewares/requireContext.middlewares";
import { bookingRateLimit } from "../middlewares/rateLimit.middlewares";
import {
  createAppointmentValidator,
  getAppointmentsValidator,
} from "../middlewares/validators/appointment.validators";
import { validateNumericId } from "../middlewares/validators/common.validators";

const router = Router();
router.use(verifyToken);

// Patient đặt online
router.post(
  "/",
  bookingRateLimit,
  requireRole(RoleCode.PATIENT),
  requirePatientContext,
  createAppointmentValidator,
  createAppointment
);

// Receptionist đặt offline
router.post(
  "/offline",
  bookingRateLimit,
  requireRole(RoleCode.RECEPTIONIST),
  createAppointmentValidator,
  createAppointment
);

//Hủy lịch trước 2 giờ
router.put(
  "/:id/cancel",
  validateNumericId("id"),
  requireRole(RoleCode.PATIENT, RoleCode.RECEPTIONIST),
  cancelAppointment
);

// Lấy danh sách lịch hẹn (PATIENT chỉ xem lịch của mình)
router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR, RoleCode.PATIENT),
  getAppointmentsValidator,
  getAppointments
);

// Get my appointments (patient or doctor)
router.get(
  "/my",
  requireRole(RoleCode.PATIENT, RoleCode.DOCTOR),
  getMyAppointments
);

// Get upcoming appointments
router.get(
  "/upcoming",
  requireRole(RoleCode.PATIENT, RoleCode.DOCTOR, RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  getUpcomingAppointments
);

// Get appointment by ID
router.get(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR, RoleCode.PATIENT),
  getAppointmentById
);

// Update appointment (reschedule)
router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.PATIENT, RoleCode.RECEPTIONIST, RoleCode.ADMIN),
  updateAppointment
);

// Mark appointment as no-show
router.put(
  "/:id/no-show",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  markNoShow
);

export default router;
