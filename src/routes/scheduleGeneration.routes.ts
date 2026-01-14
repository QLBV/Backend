import { Router } from "express";
import {
  generateMonthlySchedule,
  generateScheduleForMonth,
  previewMonthlySchedule,
} from "../controllers/scheduleGeneration.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();

// All routes require authentication and admin role
router.use(verifyToken);
router.use(requireRole(RoleCode.ADMIN));

// Generate schedule for next month (run on 25th)
router.post("/generate-monthly", generateMonthlySchedule);

// Generate schedule for specific month
router.post("/generate-for-month", generateScheduleForMonth);

// Preview what would be generated
router.get("/preview", previewMonthlySchedule);

export default router;
