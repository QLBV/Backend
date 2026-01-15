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
} from "./payroll.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { validateNumericId, validatePagination } from "../../middlewares/validators/common.validators";
import {
  validateCalculatePayroll,
  validateGetPayrolls,
  validateGetPayrollsByPeriod,
} from "../../middlewares/validators/payroll.validators";

const router = Router();


router.use(verifyToken);


router.post(
  "/calculate",
  requireRole(RoleCode.ADMIN),
  validateCalculatePayroll,
  calculatePayroll
);


router.get(
  "/statistics",
  requireRole(RoleCode.ADMIN),
  getPayrollStatistics
);


router.get(
  "/my",
  getMyPayrolls
);


router.get(
  "/period",
  requireRole(RoleCode.ADMIN),
  validateGetPayrollsByPeriod,
  getPayrollsByPeriod
);


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


router.get(
  "/doctor/:doctorId",
  validateNumericId("doctorId"),
  requireRole(RoleCode.ADMIN),
  getDoctorPayrolls
);


router.get(
  "/user/:userId",
  validateNumericId("userId"),
  getUserPayrollHistory 
);


router.get(
  "/",
  requireRole(RoleCode.ADMIN),
  validateGetPayrolls,
  getPayrolls
);


router.get(
  "/:id",
  validateNumericId("id"),
  getPayrollById 
);


router.put(
  "/:id/approve",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  approvePayroll
);


router.put(
  "/:id/pay",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  payPayroll
);


router.get(
  "/:id/pdf",
  validateNumericId("id"),
  exportPayrollPDF 
);

export default router;
