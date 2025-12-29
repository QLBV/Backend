import { Router } from "express";
import { getAllSpecialties } from "../controllers/doctor.controller";

const router = Router();

router.get("/", getAllSpecialties);

export default router;
