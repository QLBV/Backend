import { Router } from "express";
import {
  assignDoctorToShift,
  unassignDoctorFromShift,
  getDoctorsOnDuty,
} from "../controllers/doctorShift.controller";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = Router();

// Public: lấy bác sĩ trực để đặt lịch
router.get("/on-duty", getDoctorsOnDuty);

// Admin actions cần đăng nhập
router.use(verifyToken);

router.post("/", requireRole(RoleCode.ADMIN), assignDoctorToShift);
router.delete("/:id", requireRole(RoleCode.ADMIN), unassignDoctorFromShift);

export default router;
