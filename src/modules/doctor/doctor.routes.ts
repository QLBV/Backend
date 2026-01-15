import { Router } from "express";
import {
  getAllDoctors,
  getDoctorById,
  createDoctorController,
  updateDoctor,
  deleteDoctor,
  getAllSpecialties,
  getPublicDoctorsList,
  getDoctorsOnDuty,
} from "./doctor.controller";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { getShiftsByDoctor } from "./doctorShift.controller";

const router = Router();


router.get("/public-list", getPublicDoctorsList);
router.get("/specialties", getAllSpecialties);

router.use(verifyToken);


router.get(
  "/on-duty",
  requireRole(RoleCode.DOCTOR, RoleCode.ADMIN, RoleCode.RECEPTIONIST),
  getDoctorsOnDuty
);


router.get("/", requireRole(RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR), getAllDoctors);


router.get("/:doctorId/shifts", getShiftsByDoctor);


router.get("/:id", requireRole(RoleCode.ADMIN), getDoctorById);


router.post("/", requireRole(RoleCode.ADMIN), createDoctorController);


router.put("/:id", requireRole(RoleCode.ADMIN), updateDoctor);


router.delete("/:id", requireRole(RoleCode.ADMIN), deleteDoctor);

export default router;
