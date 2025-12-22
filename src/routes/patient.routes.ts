import { Router } from "express";
import {
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  uploadPatientAvatar,
  setupPatientProfile,
} from "../controllers/patient.controller";
import {
  createVisit,
  getVisitsByPatient,
  getVisitById,
  updateVisit,
  deleteVisit,
} from "../controllers/appointment.controller";

import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { validatePatient } from "../middlewares/patient.middlewares";
import { uploadPatientAvatar as uploadPatientAvatarMiddleware } from "../middlewares/uploadPatientAvatar.middlewares";

const router = Router();

// ============ AUTHENTICATION REQUIRED ============
router.use(verifyToken);

// ============ PATIENT SETUP (NEW FLOW) - PATIENT ONLY ============

// Step 1: Setup Patient Profile (after login)
// POST /api/patients/setup
// Headers: { Authorization: "Bearer <accessToken>" }
// Body: {
//   "fullName": "Nguyễn Văn A",
//   "gender": "male",
//   "dateOfBirth": "1990-05-15",
//   "cccd": "123456789012",
//   "profiles": [
//     { "type": "email", "value": "patient@example.com" },
//     { "type": "phone", "value": "0912345678" },
//     { "type": "address", "value": "123 Đường A", "city": "TP.HCM", "ward": "Quận 1" }
//   ]
// }
router.post("/setup", requireRole("PATIENT"), setupPatientProfile);

// ============ VISIT MANAGEMENT ============

// Step 2: Create Visit (after patient setup)
// POST /api/patients/visits
// Headers: { Authorization: "Bearer <accessToken>" }
// Body: {
//   "visitDate": "2025-01-15",
//   "symptomInitial": "Đau đầu, sốt cao"
// }
router.post("/visits", requireRole("PATIENT"), createVisit);

// Get all visits of current patient
// GET /api/patients/visits
// Headers: { Authorization: "Bearer <accessToken>" }
router.get("/visits", requireRole("PATIENT"), getVisitsByPatient);

// Get specific visit by ID
// GET /api/patients/visits/:id
// Headers: { Authorization: "Bearer <accessToken>" }
router.get("/visits/:id", getVisitById);

// Update visit
// PUT /api/patients/visits/:id
// Headers: { Authorization: "Bearer <accessToken>" }
// Body: { "symptomInitial": "...", "status": "examining" }
router.put("/visits/:id", updateVisit);

// Delete visit (only waiting status)
// DELETE /api/patients/visits/:id
// Headers: { Authorization: "Bearer <accessToken>" }
router.delete("/visits/:id", deleteVisit);

// ============ PATIENT CRUD (ADMIN/DOCTOR/RECEPTIONIST) ============

// GET all patients
// GET /api/patients?page=1&limit=10
router.get("/", requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"), getPatients);

// GET patient by ID
// GET /api/patients/:id
router.get(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  validatePatient,
  getPatientById
);

// UPDATE patient
// PUT /api/patients/:id
router.put(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  validatePatient,
  updatePatient
);

// DELETE patient (soft delete)
// DELETE /api/patients/:id
router.delete(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  validatePatient,
  deletePatient
);

// ============ AVATAR UPLOAD ============

// POST patient avatar
// POST /api/patients/:id/avatar
// Form-Data: { "avatar": <file> }
router.post(
  "/:id/avatar",
  requireRole("PATIENT"),
  validatePatient,
  uploadPatientAvatarMiddleware.single("avatar"),
  uploadPatientAvatar
);

export default router;
