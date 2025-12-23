import { Router } from "express";
import {
  assignDoctorToShift,
  unassignDoctorFromShift,
  getShiftsByDoctor,
  getDoctorsOnDuty,
} from "../controllers/doctorShift.controller";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "@/constant/role";

const router = Router();

router.post("/doctor-shifts", requireRole(RoleCode.ADMIN), assignDoctorToShift);

router.delete(
  "/doctor-shifts/:id",
  requireRole(RoleCode.ADMIN),
  unassignDoctorFromShift
);

router.get("/doctors/:doctorId/shifts", getShiftsByDoctor);

router.get("/doctor-shifts/on-duty", getDoctorsOnDuty);

export default router;
