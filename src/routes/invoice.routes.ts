import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  addPayment,
  getInvoicePayments,
  exportInvoicePDF,
  getInvoicesByPatient,
  getInvoiceStatistics,
} from "../controllers/invoice.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import {
  validateNumericId,
  validatePagination,
} from "../middlewares/validators/common.validators";
import {
  validateCreateInvoice,
  validateUpdateInvoice,
} from "../middlewares/validators/invoice.validators";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Statistics route (must be before /:id to avoid route conflict)
router.get("/statistics", requireRole(RoleCode.ADMIN), getInvoiceStatistics);

// Patient-specific invoices
router.get(
  "/patient/:patientId",
  validateNumericId("patientId"),
  getInvoicesByPatient // Authorization check inside controller
);

// CRUD operations
router.post(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  validateCreateInvoice,
  createInvoice
);

router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  validatePagination,
  getInvoices
);

router.get(
  "/:id",
  validateNumericId("id"),
  getInvoiceById // Authorization check inside controller
);

router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  validateUpdateInvoice,
  updateInvoice
);

// Payment operations
router.post(
  "/:id/payments",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  addPayment
);

router.get(
  "/:id/payments",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  getInvoicePayments
);

// PDF export
router.get(
  "/:id/pdf",
  validateNumericId("id"),
  exportInvoicePDF // Authorization check inside controller
);

export default router;
