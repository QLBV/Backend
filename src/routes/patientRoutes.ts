import { Router } from "express";
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../controllers/patientController";

import { verifyToken } from "../middlewares/auth";
import { requireRole } from "../middlewares/roleCheck";

const router = Router();

// Bắt buộc login
router.use(verifyToken);

//  Patient CRUD
router.post("/", requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"), createPatient);

router.get("/", requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"), getPatients);

router.get(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  getPatientById
);

router.put(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  updatePatient
);

router.delete(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  deletePatient
);

export default router;
