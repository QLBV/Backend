import { Router } from "express";
import { getAllMedicineExports, getMedicineExportById } from "./medicine.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import { validatePagination } from "../../middlewares/validators/common.validators";

const router = Router();


router.use(verifyToken);

router.get("/", requireRole(RoleCode.ADMIN), validatePagination, getAllMedicineExports);


router.get("/:id", requireRole(RoleCode.ADMIN), getMedicineExportById);

export default router;
