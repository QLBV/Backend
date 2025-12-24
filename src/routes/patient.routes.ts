import { Router } from "express";
import {
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  uploadPatientAvatar,
  setupPatientProfile,
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
} from "@/middlewares/validators/patient.validators";

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
  getPatients
);

router.get(
  "/:id",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST),
  validatePatient,
  getPatientById
);

router.put(
  "/:id",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST),
  validatePatient,
  updatePatientValidator,
  updatePatient
);

router.delete(
  "/:id",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR, RoleCode.RECEPTIONIST),
  validatePatient,
  deletePatient
);

router.post(
  "/:id/avatar",
  requireRole(RoleCode.PATIENT),
  requireSelfPatient,
  validatePatient,
  uploadMiddleware.single("avatar"),
  uploadPatientAvatar
);

export default router;
