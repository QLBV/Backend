import express from "express";
import {
  getDashboardData,
  getDashboardStats,
  getDashboardAppointmentsByDate,
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

// GET /api/dashboard - Main dashboard data
router.get("/", verifyToken, requireRole(RoleCode.ADMIN), getDashboardData);

export default router;