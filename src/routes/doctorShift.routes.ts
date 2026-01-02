import { Router } from "express";
import {
  assignDoctorToShift,
  unassignDoctorFromShift,
  getDoctorsOnDuty,
} from "../controllers/doctorShift.controller";
import {
  cancelShiftAndReschedule,
  restoreShift,
  previewReschedule,
} from "../controllers/doctorShiftReschedule.controller";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { verifyToken } from "../middlewares/auth.middlewares";
import {
  validateAssignDoctorShift,
  validateRescheduleShift,
} from "../middlewares/validators/doctorShift.validators";

const router = Router();

// Public: lấy bác sĩ trực để đặt lịch
router.get("/on-duty", getDoctorsOnDuty);

// Admin actions cần đăng nhập
router.use(verifyToken);

// Assign doctor to shift (Admin only)
router.post(
  "/",
  requireRole(RoleCode.ADMIN),
  validateAssignDoctorShift,
  assignDoctorToShift
);

// Unassign doctor from shift (Admin only)
router.delete("/:id", requireRole(RoleCode.ADMIN), unassignDoctorFromShift);

// Reschedule actions (Admin only)
router.get(
  "/:id/reschedule-preview",
  requireRole(RoleCode.ADMIN),
  previewReschedule
);

// Cancel and reschedule shift
router.post(
  "/:id/cancel-and-reschedule",
  requireRole(RoleCode.ADMIN),
  validateRescheduleShift,
  cancelShiftAndReschedule
);

// Restore shift
router.post("/:id/restore", requireRole(RoleCode.ADMIN), restoreShift);

export default router;
