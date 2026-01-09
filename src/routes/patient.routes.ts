import { Router } from "express";
import {
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  uploadPatientAvatar,
  setupPatientProfile,
  getPatientMedicalHistory,
  getPatientPrescriptions,
} from "../controllers/patient.controller";

import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { validatePatient } from "../middlewares/validatePatient.middlewares";
import { uploadPatientAvatar as uploadMiddleware } from "../middlewares/uploadPatientAvatar.middlewares";
import { requireSelfPatient } from "../middlewares/requireSelfPatient.middlewares";
import {
  setupPatientValidator,
  updatePatientValidator,
} from "../middlewares/validators/patient.validators";
import {
  validateNumericId,
  validatePagination,
} from "../middlewares/validators/common.validators";

const router = Router();
router.use(verifyToken);

router.post(
  "/setup",
  requireRole(RoleCode.PATIENT),
  setupPatientValidator,
  setupPatientProfile
);

router.get(
  "/",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST),
  validatePagination,
  getPatients
);

// Get patient's medical history
router.get(
  "/:id/medical-history",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.PATIENT),
  getPatientMedicalHistory
);

// Get patient's prescriptions
router.get(
  "/:id/prescriptions",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.PATIENT),
  getPatientPrescriptions
);

router.get(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.PATIENT),
  requireSelfPatient,
  validatePatient,
  getPatientById
);

router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(
    RoleCode.ADMIN,
    RoleCode.DOCTOR,
    RoleCode.RECEPTIONIST,
    RoleCode.PATIENT
  ),
  validatePatient,
  updatePatientValidator,
  updatePatient
);

router.delete(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST),
  validatePatient,
  deletePatient
);

router.post(
  "/:id/avatar",
  validateNumericId("id"),
  requireRole(RoleCode.PATIENT),
  requireSelfPatient,
  validatePatient,
  uploadMiddleware.single("avatar"),
  uploadPatientAvatar
);

export default router;
