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
} from "../controllers/medicine.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import {
  validateCreateMedicine,
  validateUpdateMedicine,
  validateImportMedicine,
} from "../middlewares/validateMedicine.middlewares";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Admin-only routes
router.post(
  "/",
  requireRole(RoleCode.ADMIN),
  validateCreateMedicine,
  createMedicine
);
router.put(
  "/:id",
  requireRole(RoleCode.ADMIN),
  validateUpdateMedicine,
  updateMedicine
);
router.post(
  "/:id/import",
  requireRole(RoleCode.ADMIN),
  validateImportMedicine,
  importMedicine
);
router.get("/low-stock", requireRole(RoleCode.ADMIN), getLowStockMedicines);
router.get("/:id/imports", requireRole(RoleCode.ADMIN), getMedicineImportHistory);
router.get("/:id/exports", requireRole(RoleCode.ADMIN), getMedicineExportHistory);
router.post("/:id/mark-expired", requireRole(RoleCode.ADMIN), markMedicineAsExpired);
router.delete("/:id", requireRole(RoleCode.ADMIN), removeMedicine);

// Doctor and Admin can view medicines
router.get("/", getAllMedicines);
router.get("/:id", getMedicineById);

export default router;
