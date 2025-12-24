import { Router } from "express";
import { createAppointment } from "../controllers/appointment.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { requirePatientContext } from "../middlewares/requireContext.middlewares";
import { cancelAppointment } from "../controllers/appointment.controller";
import { getAppointments } from "../controllers/appointment.controller";
import { bookingRateLimit } from "../middlewares/rateLimit.middlewares";
import {
  createAppointmentValidator,
  getAppointmentsValidator,
} from "@/middlewares/validators/appointment.validators";

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
  requireRole(RoleCode.PATIENT, RoleCode.RECEPTIONIST),
  cancelAppointment
);

// Lấy danh sách lịch hẹn
router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR),
  getAppointmentsValidator,
  getAppointments
);

export default router;
