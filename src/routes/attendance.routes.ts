import { Router } from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  requestLeave,
  runAutoAbsence,
} from "../controllers/attendance.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { validateNumericId } from "../middlewares/validators/common.validators";

const router = Router();
router.use(verifyToken);

// Check in (all authenticated users)
router.post("/check-in", checkIn);

// Check out (all authenticated users)
router.post("/check-out", checkOut);

// Get my attendance records
router.get("/my", getMyAttendance);

// Request leave
router.post("/leave-request", requestLeave);

// Get all attendance (admin/receptionist only)
router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  getAllAttendance
);

// Update attendance record (admin only)
router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  updateAttendance
);

// Run auto-absence marking (admin only)
router.post(
  "/auto-absence",
  requireRole(RoleCode.ADMIN),
  runAutoAbsence
);

export default router;
