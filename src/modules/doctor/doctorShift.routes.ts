import { Router } from "express";
import {
  assignDoctorToShift,
  unassignDoctorFromShift,
  getDoctorsOnDuty,
  getShiftsByDoctor,
  getAvailableShifts,
  getAllDoctorShifts,
  getAvailableDoctorsByDate,
} from "./doctorShift.controller";
import {
  cancelShiftAndReschedule,
  restoreShift,
  previewReschedule,
} from "./doctorShiftReschedule.controller";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { verifyToken } from "../../middlewares/auth.middlewares";
import {
  validateAssignDoctorShift,
  validateRescheduleShift,
} from "../../middlewares/validators/doctorShift.validators";

const router = Router();


router.get("/on-duty", getDoctorsOnDuty);


router.get("/available", getAvailableShifts);


router.get("/doctors-by-date", getAvailableDoctorsByDate);


router.use(verifyToken);


router.get(
  "/",
  requireRole(RoleCode.ADMIN),
  getAllDoctorShifts
);


router.post(
  "/",
  requireRole(RoleCode.ADMIN),
  validateAssignDoctorShift,
  assignDoctorToShift
);


router.get("/doctor/:doctorId", getShiftsByDoctor);


router.delete("/:id", requireRole(RoleCode.ADMIN), unassignDoctorFromShift);


router.get(
  "/:id/reschedule-preview",
  requireRole(RoleCode.ADMIN),
  previewReschedule
);


router.post(
  "/:id/cancel-and-reschedule",
  requireRole(RoleCode.ADMIN),
  validateRescheduleShift,
  cancelShiftAndReschedule
);


router.post("/:id/restore", requireRole(RoleCode.ADMIN), restoreShift);

export default router;
