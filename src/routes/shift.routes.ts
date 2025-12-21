import { Router } from "express";
import {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
} from "../controllers/shift.controller";
import { requireRole } from "../middlewares/roleCheck.middlewares";

const router = Router();

router.get("/shifts", getAllShifts);

router.get("/shifts/:id", getShiftById);

router.post("/shifts", requireRole("ADMIN"), createShift);

router.put("/shifts/:id", requireRole("ADMIN"), updateShift);

router.delete("/shifts/:id", requireRole("ADMIN"), deleteShift);

export default router;
