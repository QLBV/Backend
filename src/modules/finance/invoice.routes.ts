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
  getUnpaidInvoices,
  getRevenueByPaymentMethod,
} from "./invoice.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import {
  validateNumericId,
  validatePagination,
} from "../../middlewares/validators/common.validators";
import {
  validateCreateInvoice,
  validateUpdateInvoice,
  validateAddPayment,
  validateGetInvoices,
} from "../../middlewares/validators/invoice.validators";

const router = Router();


router.use(verifyToken);


router.get("/statistics", requireRole(RoleCode.ADMIN), getInvoiceStatistics);


router.get(
  "/revenue-by-payment-method",
  requireRole(RoleCode.ADMIN),
  getRevenueByPaymentMethod
);


router.get(
  "/unpaid",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  getUnpaidInvoices
);


router.get(
  "/patient/:patientId",
  validateNumericId("patientId"),
  getInvoicesByPatient 
);


router.post(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  validateCreateInvoice,
  createInvoice
);

router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR),
  validateGetInvoices,
  getInvoices
);

router.get(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR, RoleCode.PATIENT),
  getInvoiceById 
);

router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  validateUpdateInvoice,
  updateInvoice
);


router.post(
  "/:id/payments",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  validateAddPayment,
  addPayment
);

router.get(
  "/:id/payments",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR),
  getInvoicePayments
);


router.get(
  "/:id/pdf",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  exportInvoicePDF 
);

export default router;
