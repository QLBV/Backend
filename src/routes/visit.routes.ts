import { Router } from "express";
import {
  checkInAppointment,
  completeVisit,
} from "../controllers/visit.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";

const router = Router();
router.use(verifyToken);

// RECEPTIONIST check-in
router.post(
  "/checkin/:appointmentId",
  requireRole("RECEPTIONIST"),
  checkInAppointment
);

// DOCTOR hoàn tất khám
router.put("/:id/complete", requireRole("DOCTOR"), completeVisit);

export default router;
