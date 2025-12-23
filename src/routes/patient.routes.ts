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
import { validatePatient } from "../middlewares/patient.middlewares";
import { uploadPatientAvatar as uploadPatientAvatarMiddleware } from "../middlewares/uploadPatientAvatar.middlewares";

const router = Router();

// ============ AUTH REQUIRED ============
router.use(verifyToken);

// ============ PATIENT SETUP ============
router.post("/setup", requireRole("PATIENT"), setupPatientProfile);

// ============ PATIENT CRUD ============
router.get("/", requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"), getPatients);

router.get(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  validatePatient,
  getPatientById
);

router.put(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  validatePatient,
  updatePatient
);

router.delete(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  validatePatient,
  deletePatient
);

// ============ AVATAR ============
router.post(
  "/:id/avatar",
  requireRole("PATIENT"),
  validatePatient,
  uploadPatientAvatarMiddleware.single("avatar"),
  uploadPatientAvatar
);

export default router;
