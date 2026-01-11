import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { triggerAutoNoShowJob } from "../jobs/autoNoShow.job";

const router = Router();

// Protect all job routes with authentication
router.use(verifyToken);

/**
 * Manually trigger auto no-show job
 * GET /api/jobs/auto-no-show
 * Role: ADMIN only
 */
router.get(
  "/auto-no-show",
  requireRole(RoleCode.ADMIN),
  triggerAutoNoShowJob
);

export default router;
