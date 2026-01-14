import { Router } from "express";
import { getAllSpecialties, getDoctorsBySpecialty } from "../controllers/doctor.controller";
import { validateNumericId } from "../middlewares/validators/common.validators";

const router = Router();

router.get("/", getAllSpecialties);

// Get doctors by specialty
router.get("/:id/doctors", validateNumericId("id"), getDoctorsBySpecialty);

export default router;
