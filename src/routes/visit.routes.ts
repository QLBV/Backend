import { Router } from "express";
import {
  checkInAppointment,
  completeVisit,
  getVisits,
  getVisitById,
  getPatientVisits,
} from "../controllers/visit.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { validateNumericId } from "../middlewares/validators/common.validators";
import { validateCompleteVisit } from "../middlewares/validators/visit.validators";

const router = Router();
router.use(verifyToken);

router.post(
  "/checkin/:appointmentId",
  validateNumericId("appointmentId"),
  requireRole(RoleCode.RECEPTIONIST),
  checkInAppointment
);

router.put(
  "/:id/complete",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  validateCompleteVisit,
  completeVisit
);

// Get visit history with filters
router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  getVisits
);

// Get patient's visit history
router.get(
  "/patient/:patientId",
  validateNumericId("patientId"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  getPatientVisits
);

// Get visit by ID
router.get(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  getVisitById
);

export default router;
