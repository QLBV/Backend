import express from "express";
import {
  getRevenueReport,
  getExpenseReport,
  getTopMedicinesReport,
  getMedicineAlertsReport,
  getPatientsByGenderReport,
  getProfitReport,
  getRevenueReportPDF,
  getExpenseReportPDF,
  getProfitReportPDF,
  getTopMedicinesReportPDF,
  getPatientsByGenderReportPDF,
  getAppointmentReport,
  getPatientStatistics,
} from "../controllers/report.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = express.Router();

/**
 * All report routes require authentication and ADMIN role
 */

// GET /api/reports/revenue?year=2025&month=12
router.get("/revenue", verifyToken, requireRole(RoleCode.ADMIN), getRevenueReport);

// GET /api/reports/appointments?year=2025&month=12
router.get("/appointments", verifyToken, requireRole(RoleCode.ADMIN), getAppointmentReport);

// GET /api/reports/patient-statistics
router.get("/patient-statistics", verifyToken, requireRole(RoleCode.ADMIN), getPatientStatistics);

// GET /api/reports/expense?year=2025&month=12
router.get("/expense", verifyToken, requireRole(RoleCode.ADMIN), getExpenseReport);

// GET /api/reports/top-medicines?year=2025&month=12&limit=10
router.get("/top-medicines", verifyToken, requireRole(RoleCode.ADMIN), getTopMedicinesReport);

// GET /api/reports/medicine-alerts?daysUntilExpiry=30&minStock=10
router.get("/medicine-alerts", verifyToken, requireRole(RoleCode.ADMIN), getMedicineAlertsReport);

// GET /api/reports/patients-by-gender
router.get("/patients-by-gender", verifyToken, requireRole(RoleCode.ADMIN), getPatientsByGenderReport);

// GET /api/reports/profit?year=2025&month=12
router.get("/profit", verifyToken, requireRole(RoleCode.ADMIN), getProfitReport);

// PDF Export Routes
// GET /api/reports/revenue/pdf?year=2025&month=12
router.get("/revenue/pdf", verifyToken, requireRole(RoleCode.ADMIN), getRevenueReportPDF);

// GET /api/reports/expense/pdf?year=2025&month=12
router.get("/expense/pdf", verifyToken, requireRole(RoleCode.ADMIN), getExpenseReportPDF);

// GET /api/reports/profit/pdf?year=2025&month=12
router.get("/profit/pdf", verifyToken, requireRole(RoleCode.ADMIN), getProfitReportPDF);

// GET /api/reports/top-medicines/pdf?year=2025&month=12&limit=10
router.get("/top-medicines/pdf", verifyToken, requireRole(RoleCode.ADMIN), getTopMedicinesReportPDF);

// GET /api/reports/patients-by-gender/pdf
router.get("/patients-by-gender/pdf", verifyToken, requireRole(RoleCode.ADMIN), getPatientsByGenderReportPDF);

export default router;