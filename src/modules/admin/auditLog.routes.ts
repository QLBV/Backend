import { Router } from "express";
import {
  getAllAuditLogs,
  getRecordAuditTrailController,
  getUserActivityController,
  getMyActivity,
} from "./auditLog.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";

const router = Router();


router.use(verifyToken);


router.get("/me", getMyActivity);


router.get(
  "/",
  requireRole(RoleCode.ADMIN),
  getAllAuditLogs
);

router.get(
  "/:tableName/:recordId",
  requireRole(RoleCode.ADMIN),
  getRecordAuditTrailController
);

router.get(
  "/user/:userId",
  requireRole(RoleCode.ADMIN),
  getUserActivityController
);

export default router;
