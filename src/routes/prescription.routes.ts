import { Router } from "express";
import {
  createPrescription,
  updatePrescription,
  cancelPrescription,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionByVisit,
  exportPrescriptionPDF,
} from "../controllers/prescription.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import {
  validateCreatePrescription,
  validateUpdatePrescription,
} from "../middlewares/validatePrescription.middlewares";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Doctor-only routes
router.post(
  "/",
  requireRole(RoleCode.DOCTOR),
  validateCreatePrescription,
  createPrescription
);
router.put(
  "/:id",
  requireRole(RoleCode.DOCTOR),
  validateUpdatePrescription,
  updatePrescription
);
router.post("/:id/cancel", requireRole(RoleCode.DOCTOR), cancelPrescription);
router.get("/visit/:visitId", requireRole(RoleCode.DOCTOR), getPrescriptionByVisit);

// Doctor and Patient can view prescriptions
router.get("/:id/pdf", exportPrescriptionPDF); // Must be before /:id to avoid route conflict
router.get("/:id", getPrescriptionById);
router.get("/patient/:patientId", getPrescriptionsByPatient);

export default router;
