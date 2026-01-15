import { Router } from "express";
import {
  checkInAppointment,
  startExamination,
  completeVisit,
  getVisits,
  getVisitById,
  getPatientVisits,
  createReferral,
  getPendingReferrals,
  completeReferral,
} from "./visit.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { validateNumericId } from "../../middlewares/validators/common.validators";
import { validateCompleteVisit } from "../../middlewares/validators/visit.validators";

const router = Router();
router.use(verifyToken);


router.post(
  "/referral",
  requireRole(RoleCode.DOCTOR),
  createReferral
);

router.get(
  "/referrals/pending",
  requireRole(RoleCode.DOCTOR),
  getPendingReferrals
);

router.put(
  "/referral/complete",
  requireRole(RoleCode.DOCTOR),
  completeReferral
);

router.post(
  "/checkin/:appointmentId",
  validateNumericId("appointmentId"),
  requireRole(RoleCode.RECEPTIONIST, RoleCode.ADMIN),
  checkInAppointment
);

router.put(
  "/:id/start",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  startExamination
);

router.put(
  "/:id/complete",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  validateCompleteVisit,
  completeVisit
);


router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  getVisits
);


router.get(
  "/patient/:patientId",
  validateNumericId("patientId"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  getPatientVisits
);


router.get(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  getVisitById
);

export default router;
