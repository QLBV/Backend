import { Router } from "express";
import { getAllMedicineImports } from "../controllers/medicine.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { validatePagination } from "../middlewares/validators/common.validators";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get all medicine imports
router.get(
  "/",
  requireRole(RoleCode.ADMIN),
  validatePagination,
  getAllMedicineImports
);

export default router;
