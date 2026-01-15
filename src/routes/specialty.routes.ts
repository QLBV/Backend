import { Router } from "express";
import {
  getAllSpecialties,
  getDoctorsBySpecialty,
  getSpecialtyById,
  updateSpecialtyById,
} from "../controllers/doctor.controller";
import { validateNumericId } from "../middlewares/validators/common.validators";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();

router.get("/", getAllSpecialties);

// Get specialty by id
router.get("/:id", validateNumericId("id"), getSpecialtyById);

// Get doctors by specialty
router.get("/:id/doctors", validateNumericId("id"), getDoctorsBySpecialty);

// Admin routes
router.use(verifyToken);
router.put("/:id", validateNumericId("id"), requireRole(RoleCode.ADMIN), updateSpecialtyById);

export default router;
