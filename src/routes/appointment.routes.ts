// routes/appointment.routes.ts
import { Router } from "express";
import { createAppointment } from "../controllers/appointment.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";

const router = Router();

router.use(verifyToken);

// Patient tự đặt
router.post("/", requireRole("PATIENT"), createAppointment);

// Receptionist đặt hộ
router.post("/offline", requireRole("RECEPTIONIST"), createAppointment);

export default router;
