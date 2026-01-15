import { Router } from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  requestLeave,
  runAutoAbsence,
} from "./attendance.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { validateNumericId } from "../../middlewares/validators/common.validators";

const router = Router();
router.use(verifyToken);


router.post("/check-in", checkIn);


router.post("/check-out", checkOut);


router.get("/my", getMyAttendance);


router.post("/leave-request", requestLeave);


router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  getAllAttendance
);


router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  updateAttendance
);


router.post(
  "/auto-absence",
  requireRole(RoleCode.ADMIN),
  runAutoAbsence
);

export default router;
