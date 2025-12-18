import { Router } from "express";
import {
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  uploadPatientAvatar,
  createPatientIdentity,
  updatePatientProfile,
} from "../controllers/patient.controller";

import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { validatePatient } from "../middlewares/patient.middlewares";
import { uploadPatientAvatar as uploadPatientAvatarMiddleware } from "../middlewares/uploadPatientAvatar.middlewares";
import { createVisit } from "../controllers/appointment.controller";

const router = Router();

// Bắt buộc login
router.use(verifyToken);

// ============ MULTI-STEP REGISTRATION ============

// Bước 2: Tạo Patient Identity (NEW)
router.post(
  "/identity",
  requireRole("ADMIN", "RECEPTIONIST", "PATIENT"),
  createPatientIdentity
);

// Bước 3: Thêm Patient Profiles (NEW)
router.post(
  "/:id/profiles",
  requireRole("ADMIN", "RECEPTIONIST", "PATIENT"),
  validatePatient,
  updatePatientProfile
);

// Bước 4: Tạo Visit (Triệu chứng)
router.post(
  "/:id/visits",
  requireRole("ADMIN", "RECEPTIONIST", "PATIENT"),
  validatePatient,
  createVisit
);

// ============ PATIENT CRUD (ADMIN/DOCTOR/RECEPTIONIST) ============
// Patient phải tạo qua /patients/identity (Multi-Step)

// GET: Lấy danh sách bệnh nhân
router.get("/", requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"), getPatients);

// GET: Lấy chi tiết bệnh nhân
router.get(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  getPatientById
);

// PUT: Cập nhật thông tin bệnh nhân
router.put(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  updatePatient
);

// DELETE: Xóa bệnh nhân (soft delete)
router.delete(
  "/:id",
  requireRole("ADMIN", "DOCTOR", "RECEPTIONIST"),
  deletePatient
);

// POST: Upload avatar
router.post(
  "/:id/avatar",
  requireRole("PATIENT"),
  uploadPatientAvatarMiddleware.single("avatar"),
  uploadPatientAvatar
);

export default router;
