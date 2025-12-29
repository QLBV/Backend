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
} from "../controllers/medicine.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import {
  validateCreateMedicine,
  validateUpdateMedicine,
  validateImportMedicine,
} from "../middlewares/validateMedicine.middlewares";
import { validateNumericId, validatePagination } from "../middlewares/validators/common.validators";

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

// Warning & Alert routes (must be before /:id routes to avoid route conflict)
router.get("/low-stock", requireRole(RoleCode.ADMIN), validatePagination, getLowStockMedicines);
router.get("/expiring", requireRole(RoleCode.ADMIN), validatePagination, getExpiringMedicines);
router.post("/auto-mark-expired", requireRole(RoleCode.ADMIN), autoMarkExpired);

// Medicine management routes
router.get("/:id/imports", validateNumericId("id"), requireRole(RoleCode.ADMIN), getMedicineImportHistory);
router.get("/:id/exports", validateNumericId("id"), requireRole(RoleCode.ADMIN), getMedicineExportHistory);
router.post("/:id/mark-expired", validateNumericId("id"), requireRole(RoleCode.ADMIN), markMedicineAsExpired);
router.delete("/:id", validateNumericId("id"), requireRole(RoleCode.ADMIN), removeMedicine);

// Doctor and Admin can view medicines
router.get("/", validatePagination, getAllMedicines);
router.get("/:id", validateNumericId("id"), getMedicineById);

export default router;
