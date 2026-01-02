import { Router } from "express";
import {
  searchAppointments,
  searchInvoices,
  searchPatients,
} from "../controllers/search.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();

router.use(verifyToken);

router.post(
  "/patients",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST),
  searchPatients
);

router.post(
  "/appointments",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST),
  searchAppointments
);

router.post(
  "/invoices",
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  searchInvoices
);

export default router;
