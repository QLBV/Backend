import { Router } from "express";
import { createAppointment } from "../controllers/appointment.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();

router.use(verifyToken);

// Patient đặt online
router.post("/", requireRole(RoleCode.PATIENT), createAppointment);

// Receptionist đặt offline
router.post("/offline", requireRole(RoleCode.RECEPTIONIST), createAppointment);

export default router;
