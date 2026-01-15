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
} from "./appointment.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { requirePatientContext } from "../../middlewares/requireContext.middlewares";
import { bookingRateLimit } from "../../middlewares/rateLimit.middlewares";
import {
  createAppointmentValidator,
  getAppointmentsValidator,
  validateUpdateAppointment,
  validateCancelAppointment,
} from "../../middlewares/validators/appointment.validators";
import { validateNumericId } from "../../middlewares/validators/common.validators";
import { uploadSymptomImages as uploadMiddleware } from "../../middlewares/uploadSymptomImages.middlewares";
import { uploadSymptomImages } from "./appointment.controller";

const router = Router();
router.use(verifyToken);


router.post(
  "/",
  bookingRateLimit,
  requireRole(RoleCode.PATIENT),
  requirePatientContext,
  createAppointmentValidator,
  createAppointment
);


router.post(
  "/offline",
  bookingRateLimit,
  requireRole(RoleCode.RECEPTIONIST),
  createAppointmentValidator,
  createAppointment
);


router.put(
  "/:id/cancel",
  validateNumericId("id"),
  requireRole(RoleCode.PATIENT, RoleCode.RECEPTIONIST),
  validateCancelAppointment,
  cancelAppointment
);


router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR, RoleCode.PATIENT),
  getAppointmentsValidator,
  getAppointments
);


router.get(
  "/my",
  requireRole(RoleCode.PATIENT, RoleCode.DOCTOR),
  getMyAppointments
);


router.get(
  "/upcoming",
  requireRole(RoleCode.PATIENT, RoleCode.DOCTOR, RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  getUpcomingAppointments
);


router.get(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR, RoleCode.PATIENT),
  getAppointmentById
);


router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.PATIENT, RoleCode.RECEPTIONIST, RoleCode.ADMIN),
  validateUpdateAppointment,
  updateAppointment
);


router.put(
  "/:id/no-show",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  markNoShow
);


router.post(
  "/:id/symptoms/images",
  validateNumericId("id"),
  requireRole(RoleCode.PATIENT, RoleCode.RECEPTIONIST, RoleCode.ADMIN),
  uploadMiddleware.array("images", 5),
  uploadSymptomImages
);



export default router;
