import { Router } from "express";
import {
  checkInAppointment,
  completeVisit,
} from "../controllers/visit.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();
router.use(verifyToken);

router.post(
  "/checkin/:appointmentId",
  requireRole(RoleCode.RECEPTIONIST),
  checkInAppointment
);

router.put("/:id/complete", requireRole(RoleCode.DOCTOR), completeVisit);

export default router;
