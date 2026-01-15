import { Router } from "express";
import {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getShiftSchedule,
} from "./shift.controller";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { verifyToken } from "../../middlewares/auth.middlewares";

const router = Router();
router.use(verifyToken);

router.get("/", getAllShifts);


router.get("/schedule", getShiftSchedule);

router.get("/:id", getShiftById);
router.post("/", requireRole(RoleCode.ADMIN), createShift);
router.put("/:id", requireRole(RoleCode.ADMIN), updateShift);
router.delete("/:id", requireRole(RoleCode.ADMIN), deleteShift);

export default router;
