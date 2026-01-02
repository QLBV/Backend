import { Router } from "express";
import {
  createPrescription,
  updatePrescription,
  cancelPrescription,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionByVisit,
  exportPrescriptionPDF,
  dispensePrescription,
} from "../controllers/prescription.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import {
  validateCreatePrescription,
  validateUpdatePrescription,
} from "../middlewares/validatePrescription.middlewares";
import { validateNumericId } from "../middlewares/validators/common.validators";

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
// Update prescription
router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  validateUpdatePrescription,
  updatePrescription
);
// Cancel prescription
router.post(
  "/:id/cancel",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  cancelPrescription
);
// Dispense prescription
router.put(
  "/:id/dispense",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  dispensePrescription
);
// Get prescription by visit ID
router.get(
  "/visit/:visitId",
  validateNumericId("visitId"),
  requireRole(RoleCode.DOCTOR),
  getPrescriptionByVisit
);

// Doctor and Patient can view prescriptions
router.get("/:id/pdf", validateNumericId("id"), exportPrescriptionPDF); // Must be before /:id to avoid route conflict
// Get prescription by ID
router.get("/:id", validateNumericId("id"), getPrescriptionById);
// Get prescriptions by patient ID
router.get(
  "/patient/:patientId",
  validateNumericId("patientId"),
  getPrescriptionsByPatient
);

export default router;
