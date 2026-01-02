import { Router } from "express";
import {
  checkInAppointment,
  completeVisit,
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

export default router;
