import express from "express";
import {
  getDashboardData,
  getDashboardStats,
  getDashboardAppointmentsByDate,
  getDashboardOverview,
  getRecentActivities,
  getQuickStats,
  getSystemAlerts,
  getLandingStats,
} from "./dashboard.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";

const router = express.Router();

router.get("/public/landing-stats", getLandingStats);
router.get("/stats", verifyToken, requireRole(RoleCode.ADMIN), getDashboardStats);
router.get("/appointments/:date", verifyToken, requireRole(RoleCode.ADMIN), getDashboardAppointmentsByDate);
router.get("/overview", verifyToken, requireRole(RoleCode.ADMIN), getDashboardOverview);
router.get("/recent-activities", verifyToken, requireRole(RoleCode.ADMIN), getRecentActivities);
router.get("/quick-stats", verifyToken, requireRole(RoleCode.ADMIN), getQuickStats);
router.get("/alerts", verifyToken, requireRole(RoleCode.ADMIN), getSystemAlerts);
router.get("/", verifyToken, requireRole(RoleCode.ADMIN), getDashboardData);

export default router;
