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

const router = Router();

router.get("/doctors", requireRole("ADMIN"), getAllDoctors);

router.get("/doctors/:id", requireRole("ADMIN"), getDoctorById);

router.post("/doctors", requireRole("ADMIN"), createDoctorController);

router.put("/doctors/:id", requireRole("ADMIN"), updateDoctor);

router.delete("/doctors/:id", requireRole("ADMIN"), deleteDoctor);

router.get("/specialties", getAllSpecialties);

export default router;
