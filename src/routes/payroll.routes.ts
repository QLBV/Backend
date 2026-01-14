import { Router } from "express";
import {
  calculatePayroll,
  getPayrolls,
  getMyPayrolls,
  getPayrollById,
  approvePayroll,
  payPayroll,
  getUserPayrollHistory,
  getPayrollStatistics,
  exportPayrollPDF,
  exportPayrollsExcel,
  exportPayrollsPDF as exportAllPayrollsPDF,
  getDoctorPayrolls,
  getPayrollsByPeriod,
} from "../controllers/payroll.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { validateNumericId, validatePagination } from "../middlewares/validators/common.validators";
import {
  validateCalculatePayroll,
  validateGetPayrolls,
  validateGetPayrollsByPeriod,
} from "../middlewares/validators/payroll.validators";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Calculate payroll (Admin only)
router.post(
  "/calculate",
  requireRole(RoleCode.ADMIN),
  validateCalculatePayroll,
  calculatePayroll
);

// Statistics (Admin only) - must be before /:id
router.get(
  "/statistics",
  requireRole(RoleCode.ADMIN),
  getPayrollStatistics
);

// My payrolls (all authenticated users)
router.get(
  "/my",
  getMyPayrolls
);

// Get payrolls by period - must be before /:id to avoid conflict
router.get(
  "/period",
  requireRole(RoleCode.ADMIN),
  validateGetPayrollsByPeriod,
  getPayrollsByPeriod
);

// Export all payrolls (Admin only)
router.get(
  "/export/excel",
  requireRole(RoleCode.ADMIN),
  exportPayrollsExcel
);

router.get(
  "/export/pdf",
  requireRole(RoleCode.ADMIN),
  exportAllPayrollsPDF
);

// Get doctor payrolls - must be before /:id to avoid conflict
router.get(
  "/doctor/:doctorId",
  validateNumericId("doctorId"),
  requireRole(RoleCode.ADMIN),
  getDoctorPayrolls
);

// User payroll history - must be before /:id to avoid conflict
router.get(
  "/user/:userId",
  validateNumericId("userId"),
  getUserPayrollHistory // Authorization check inside controller
);

// Get all payrolls (Admin only)
router.get(
  "/",
  requireRole(RoleCode.ADMIN),
  validateGetPayrolls,
  getPayrolls
);

// Get payroll by ID
router.get(
  "/:id",
  validateNumericId("id"),
  getPayrollById // Authorization check inside controller
);

// Approve payroll (Admin only)
router.put(
  "/:id/approve",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  approvePayroll
);

// Mark as paid (Admin only)
router.put(
  "/:id/pay",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  payPayroll
);

// Export PDF
router.get(
  "/:id/pdf",
  validateNumericId("id"),
  exportPayrollPDF // Authorization check inside controller
);

export default router;
