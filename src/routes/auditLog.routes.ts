import { Router } from "express";
import {
  getAllAuditLogs,
  getRecordAuditTrailController,
  getUserActivityController,
  getMyActivity,
} from "../controllers/auditLog.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// User can view their own activity
router.get("/me", getMyActivity);

// Admin-only routes
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
