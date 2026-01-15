import { Router } from "express";
import {
  createPrescription,
  updatePrescription,
  cancelPrescription,
  lockPrescription,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPrescriptionByVisit,
  exportPrescriptionPDF,
  dispensePrescription,
  getPrescriptions,
} from "./prescription.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import {
  validateCreatePrescription,
  validateUpdatePrescription,
} from "../../middlewares/validatePrescription.middlewares";
import { validateNumericId } from "../../middlewares/validators/common.validators";

const router = Router();


router.use(verifyToken);


router.get("/", getPrescriptions);


router.post(
  "/",
  requireRole(RoleCode.DOCTOR),
  validateCreatePrescription,
  createPrescription
);

router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  validateUpdatePrescription,
  updatePrescription
);

router.post(
  "/:id/cancel",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  cancelPrescription
);

router.post(
  "/:id/lock",
  validateNumericId("id"),
  requireRole(RoleCode.DOCTOR),
  lockPrescription
);

router.put(
  "/:id/dispense",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  dispensePrescription
);

router.get(
  "/visit/:visitId",
  validateNumericId("visitId"),
  requireRole(RoleCode.DOCTOR),
  getPrescriptionByVisit
);


router.get("/:id/pdf", validateNumericId("id"), exportPrescriptionPDF); 

router.get("/:id", validateNumericId("id"), getPrescriptionById);

router.get(
  "/patient/:patientId",
  validateNumericId("patientId"),
  getPrescriptionsByPatient
);

export default router;
