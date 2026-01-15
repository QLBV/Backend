import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { triggerAutoNoShowJob } from "../../jobs/autoNoShow.job";

const router = Router();


router.use(verifyToken);


router.get(
  "/auto-no-show",
  requireRole(RoleCode.ADMIN),
  triggerAutoNoShowJob
);

export default router;
