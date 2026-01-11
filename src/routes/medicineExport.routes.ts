import { Router } from "express";
import { getAllMedicineExports, getMedicineExportById } from "../controllers/medicine.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { validatePagination } from "../middlewares/validators/common.validators";

const router = Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", requireRole(RoleCode.ADMIN), validatePagination, getAllMedicineExports);

// Get medicine export by ID
router.get("/:id", requireRole(RoleCode.ADMIN), getMedicineExportById);

export default router;
