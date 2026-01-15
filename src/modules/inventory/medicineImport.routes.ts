import { Router } from "express";
import { getAllMedicineImports, getMedicineImportById } from "./medicine.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { validatePagination } from "../../middlewares/validators/common.validators";

const router = Router();


router.use(verifyToken);

router.get("/", requireRole(RoleCode.ADMIN), validatePagination, getAllMedicineImports);


router.get("/:id", requireRole(RoleCode.ADMIN), getMedicineImportById);

export default router;
