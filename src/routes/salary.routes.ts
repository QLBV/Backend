import { Router } from "express";
import {
  calculateSalary,
  getSalariesByDoctor,
  getSalaryDetail,
  updateSalary,
} from "../controllers/salary.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();

router.use(verifyToken);

router.post("/calculate", requireRole(RoleCode.ADMIN), calculateSalary);

router.get(
  "/doctor/:doctorId",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR),
  getSalariesByDoctor
);

router.get(
  "/:id",
  requireRole(RoleCode.ADMIN, RoleCode.DOCTOR),
  getSalaryDetail
);

router.put("/:id", requireRole(RoleCode.ADMIN), updateSalary);

export default router;
