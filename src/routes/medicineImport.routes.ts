import { Router } from "express";
import { getAllMedicineImports, getMedicineImportById } from "../controllers/medicine.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import { validatePagination } from "../middlewares/validators/common.validators";

const router = Router();

// All routes require authentication
router.use(verifyToken);

router.get("/", requireRole(RoleCode.ADMIN), validatePagination, getAllMedicineImports);

// Get medicine import by ID
router.get("/:id", requireRole(RoleCode.ADMIN), getMedicineImportById);

export default router;
