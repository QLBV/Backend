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
import { verifyToken } from "@/middlewares/auth.middlewares";
import { getShiftsByDoctor } from "@/controllers/doctorShift.controller";

const router = Router();
router.use(verifyToken);

router.get("/", 
  requireRole(RoleCode.ADMIN), 
  getAllDoctors);

router.get("/:id", 
  requireRole(RoleCode.ADMIN), 
  getDoctorById);

router.post("/", 
  requireRole(RoleCode.ADMIN), 
  createDoctorController);

router.put("/:id", 
  requireRole(RoleCode.ADMIN), 
  updateDoctor);

router.delete("/:id", 
  requireRole(RoleCode.ADMIN), 
  deleteDoctor);

router.get("/specialties", 
  getAllSpecialties);

router.get("/:doctorId/shifts", 
  getShiftsByDoctor);

export default router;
