import express from "express";
import {
  getDashboardData,
  getDashboardStats,
  getDashboardAppointmentsByDate,
  getDashboardOverview,
  getRecentActivities,
  getQuickStats,
  getSystemAlerts,
} from "../controllers/dashboard.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = express.Router();

/**
 * All dashboard routes require authentication and ADMIN role
 */

// GET /api/dashboard/stats - Must come before /:id patterns
router.get("/stats", verifyToken, requireRole(RoleCode.ADMIN), getDashboardStats);

// GET /api/dashboard/appointments/:date - Calendar widget
router.get("/appointments/:date", verifyToken, requireRole(RoleCode.ADMIN), getDashboardAppointmentsByDate);

// GET /api/dashboard/overview - Summary cards
router.get("/overview", verifyToken, requireRole(RoleCode.ADMIN), getDashboardOverview);

// GET /api/dashboard/recent-activities - Activity feed
router.get("/recent-activities", verifyToken, requireRole(RoleCode.ADMIN), getRecentActivities);

// GET /api/dashboard/quick-stats - Quick stats
router.get("/quick-stats", verifyToken, requireRole(RoleCode.ADMIN), getQuickStats);

// GET /api/dashboard/alerts - System alerts
router.get("/alerts", verifyToken, requireRole(RoleCode.ADMIN), getSystemAlerts);

// GET /api/dashboard - Main dashboard data
router.get("/", verifyToken, requireRole(RoleCode.ADMIN), getDashboardData);

export default router;
