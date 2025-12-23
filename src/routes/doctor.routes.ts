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

const router = Router();
router.use(verifyToken);

router.get("/doctors", requireRole(RoleCode.ADMIN), getAllDoctors);

router.get("/doctors/:id", requireRole(RoleCode.ADMIN), getDoctorById);

router.post("/doctors", requireRole(RoleCode.ADMIN), createDoctorController);
router.put("/doctors/:id", requireRole(RoleCode.ADMIN), updateDoctor);

router.delete("/doctors/:id", requireRole(RoleCode.ADMIN), deleteDoctor);

router.get("/specialties", getAllSpecialties);

export default router;
