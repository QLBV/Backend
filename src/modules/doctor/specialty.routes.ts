import { Router } from "express";
import {
  getAllSpecialties,
  getDoctorsBySpecialty,
  getSpecialtyById,
  updateSpecialtyById,
} from "./doctor.controller";
import { validateNumericId } from "../../middlewares/validators/common.validators";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";

const router = Router();

router.get("/", getAllSpecialties);


router.get("/:id", validateNumericId("id"), getSpecialtyById);


router.get("/:id/doctors", validateNumericId("id"), getDoctorsBySpecialty);


router.use(verifyToken);
router.put("/:id", validateNumericId("id"), requireRole(RoleCode.ADMIN), updateSpecialtyById);

export default router;
