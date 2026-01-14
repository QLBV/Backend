import { Router } from "express";
import {
  assignDoctorToShift,
  unassignDoctorFromShift,
  getDoctorsOnDuty,
  getShiftsByDoctor,
  getAvailableShifts,
  getAllDoctorShifts,
  getAvailableDoctorsByDate,
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

// Public: get available shifts
router.get("/available", getAvailableShifts);

// Public: get available doctors by date (NEW - for booking flow: Date -> Doctor)
router.get("/doctors-by-date", getAvailableDoctorsByDate);

// Admin actions cần đăng nhập
router.use(verifyToken);

// Get all doctor shifts (Admin only) - Must be before /doctor/:doctorId
router.get(
  "/",
  requireRole(RoleCode.ADMIN),
  getAllDoctorShifts
);

// Assign doctor to shift (Admin only)
router.post(
  "/",
  requireRole(RoleCode.ADMIN),
  validateAssignDoctorShift,
  assignDoctorToShift
);

// Get shifts by doctor
router.get("/doctor/:doctorId", getShiftsByDoctor);

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
