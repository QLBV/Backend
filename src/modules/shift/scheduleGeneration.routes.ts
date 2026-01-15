import { Router } from "express";
import {
  generateMonthlySchedule,
  generateScheduleForMonth,
  previewMonthlySchedule,
} from "./scheduleGeneration.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";

const router = Router();


router.use(verifyToken);
router.use(requireRole(RoleCode.ADMIN));


router.post("/generate-monthly", generateMonthlySchedule);


router.post("/generate-for-month", generateScheduleForMonth);


router.get("/preview", previewMonthlySchedule);

export default router;
