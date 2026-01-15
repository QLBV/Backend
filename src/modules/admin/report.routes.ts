import express from "express";
import {
  getRevenueReport,
  getExpenseReport,
  getTopMedicinesReport,
  getMedicineAlertsReport,
  getPatientsByGenderReport,
  getProfitReport,
  getRevenueReportPDF,
  getRevenueReportExcel,
  getExpenseReportPDF,
  getExpenseReportExcel,
  getProfitReportPDF,
  getTopMedicinesReportPDF,
  getPatientsByGenderReportPDF,
  getProfitReportExcel,
  getAppointmentReport,
  getAppointmentReportPDF,
  getAppointmentReportExcel,
  getPatientStatistics,
  getPatientStatisticsPDF,
  getPatientStatisticsExcel,
} from "./report.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";

const router = express.Router();
router.get("/revenue", verifyToken, requireRole(RoleCode.ADMIN), getRevenueReport);
router.get("/appointments", verifyToken, requireRole(RoleCode.ADMIN), getAppointmentReport);
router.get("/patient-statistics", verifyToken, requireRole(RoleCode.ADMIN), getPatientStatistics);
router.get("/expense", verifyToken, requireRole(RoleCode.ADMIN), getExpenseReport);
router.get("/top-medicines", verifyToken, requireRole(RoleCode.ADMIN), getTopMedicinesReport);
router.get("/medicine-alerts", verifyToken, requireRole(RoleCode.ADMIN), getMedicineAlertsReport);
router.get("/patients-by-gender", verifyToken, requireRole(RoleCode.ADMIN), getPatientsByGenderReport);
router.get("/profit", verifyToken, requireRole(RoleCode.ADMIN), getProfitReport);
router.get("/revenue/pdf", verifyToken, requireRole(RoleCode.ADMIN), getRevenueReportPDF);
router.get("/revenue/excel", verifyToken, requireRole(RoleCode.ADMIN), getRevenueReportExcel);
router.get("/expense/pdf", verifyToken, requireRole(RoleCode.ADMIN), getExpenseReportPDF);
router.get("/expense/excel", verifyToken, requireRole(RoleCode.ADMIN), getExpenseReportExcel);
router.get("/profit/pdf", verifyToken, requireRole(RoleCode.ADMIN), getProfitReportPDF);
router.get("/profit/excel", verifyToken, requireRole(RoleCode.ADMIN), getProfitReportExcel);
router.get("/top-medicines/pdf", verifyToken, requireRole(RoleCode.ADMIN), getTopMedicinesReportPDF);
router.get("/patients-by-gender/pdf", verifyToken, requireRole(RoleCode.ADMIN), getPatientsByGenderReportPDF);
router.get("/appointments/pdf", verifyToken, requireRole(RoleCode.ADMIN), getAppointmentReportPDF);
router.get("/appointments/excel", verifyToken, requireRole(RoleCode.ADMIN), getAppointmentReportExcel);
router.get("/patient-statistics/pdf", verifyToken, requireRole(RoleCode.ADMIN), getPatientStatisticsPDF);
router.get("/patient-statistics/excel", verifyToken, requireRole(RoleCode.ADMIN), getPatientStatisticsExcel);

export default router;