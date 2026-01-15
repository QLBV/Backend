import { Router } from "express";
import {
  createMedicine,
  updateMedicine,
  importMedicine,
  getAllMedicines,
  getMedicineById,
  getLowStockMedicines,
  getMedicineImportHistory,
  getMedicineExportHistory,
  markMedicineAsExpired,
  removeMedicine,
  getExpiringMedicines,
  autoMarkExpired,
  exportMedicine,
  getAllMedicineImports,
  getAllMedicineExports,
} from "./medicine.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";
import {
  validateCreateMedicine,
  validateUpdateMedicine,
  validateImportMedicine,
} from "../../middlewares/validateMedicine.middlewares";
import { validateExportMedicine } from "../../middlewares/validators/medicine.validators";
import { validateNumericId, validatePagination } from "../../middlewares/validators/common.validators";

const router = Router();


router.use(verifyToken);


router.post(
  "/",
  requireRole(RoleCode.ADMIN),
  validateCreateMedicine,
  createMedicine
);
router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  validateUpdateMedicine,
  updateMedicine
);
router.post(
  "/:id/import",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  validateImportMedicine,
  importMedicine
);
router.post(
  "/:id/export",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  validateExportMedicine,
  exportMedicine
);


router.get("/low-stock", requireRole(RoleCode.ADMIN), validatePagination, getLowStockMedicines);
router.get("/expiring", requireRole(RoleCode.ADMIN), validatePagination, getExpiringMedicines);
router.post("/auto-mark-expired", requireRole(RoleCode.ADMIN), autoMarkExpired);


router.get("/:id/imports", validateNumericId("id"), requireRole(RoleCode.ADMIN), getMedicineImportHistory);
router.get("/:id/exports", validateNumericId("id"), requireRole(RoleCode.ADMIN), getMedicineExportHistory);
router.post("/:id/mark-expired", validateNumericId("id"), requireRole(RoleCode.ADMIN), markMedicineAsExpired);
router.delete("/:id", validateNumericId("id"), requireRole(RoleCode.ADMIN), removeMedicine);


router.get("/", validatePagination, getAllMedicines);
router.get("/:id", validateNumericId("id"), getMedicineById);

export default router;
