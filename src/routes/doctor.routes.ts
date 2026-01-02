import { Router } from "express";
import {
  getAllDoctors,
  getDoctorById,
  createDoctorController,
  updateDoctor,
  deleteDoctor,
  getAllSpecialties,
} from "../controllers/doctor.controller";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { verifyToken } from "../middlewares/auth.middlewares";
import { getShiftsByDoctor } from "../controllers/doctorShift.controller";

const router = Router();

router.use(verifyToken);
// Get all doctors (Admin only)
router.get("/", requireRole(RoleCode.ADMIN), getAllDoctors);

//  Get shifts by doctor ID
router.get("/:doctorId/shifts", getShiftsByDoctor);

// Get doctor by ID (Admin only)
router.get("/:id", requireRole(RoleCode.ADMIN), getDoctorById);

// Create new doctor (Admin only)
router.post("/", requireRole(RoleCode.ADMIN), createDoctorController);

// Update doctor (Admin only)
router.put("/:id", requireRole(RoleCode.ADMIN), updateDoctor);

// Delete doctor (Admin only)
router.delete("/:id", requireRole(RoleCode.ADMIN), deleteDoctor);

export default router;
