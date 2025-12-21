import { Router } from "express";
import {
  assignDoctorToShift,
  unassignDoctorFromShift,
  getShiftsByDoctor,
  getDoctorsOnDuty,
} from "../controllers/doctorShift.controller";
import { requireRole } from "../middlewares/roleCheck.middlewares";

const router = Router();

router.post("/doctor-shifts", requireRole("ADMIN"), assignDoctorToShift);

router.delete(
  "/doctor-shifts/:id",
  requireRole("ADMIN"),
  unassignDoctorFromShift
);

router.get("/doctors/:doctorId/shifts", getShiftsByDoctor);

router.get("/doctor-shifts/on-duty", getDoctorsOnDuty);

export default router;
