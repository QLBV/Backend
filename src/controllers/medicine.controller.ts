import { Request, Response } from "express";
import {
  createMedicineService,
  updateMedicineService,
  importMedicineService,
  getAllMedicinesService,
  getMedicineByIdService,
  getLowStockMedicinesService,
  getMedicineImportHistoryService,
  getMedicineExportHistoryService,
  markMedicineAsExpiredService,
  removeMedicineService,
  getExpiringMedicinesService,
  autoMarkExpiredMedicinesService,
} from "../services/medicine.service";

/**
 * Create a new medicine
 * POST /api/medicines
 * Role: ADMIN
 */
export const createMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await createMedicineService(req.body);

    return res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: medicine,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create medicine",
    });
  }
};

/**
 * Update medicine information
 * PUT /api/medicines/:id
 * Role: ADMIN
 */
export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medicine = await updateMedicineService(Number(id), req.body);

    return res.json({
      success: true,
      message: "Medicine updated successfully",
      data: medicine,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to update medicine";

    if (errorMessage === "MEDICINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Import medicine stock
 * POST /api/medicines/:id/import
 * Role: ADMIN
 */
export const importMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, importPrice } = req.body;
    const userId = req.user!.userId;

    const result = await importMedicineService({
      medicineId: Number(id),
      quantity,
      importPrice,
      userId,
    });

    return res.json({
      success: true,
      message: "Medicine imported successfully",
      data: result,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to import medicine";

    if (errorMessage === "MEDICINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Get all medicines with optional filters
 * GET /api/medicines
 * Role: DOCTOR, ADMIN
 */
export const getAllMedicines = async (req: Request, res: Response) => {
  try {
    const { status, group, lowStock, search } = req.query;

    const medicines = await getAllMedicinesService({
      status: status as any,
      group: group as string,
      lowStock: lowStock === "true",
      search: search as string,
    });

    return res.json({
      success: true,
      data: medicines,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get medicines",
    });
  }
};

/**
 * Get medicine by ID
 * GET /api/medicines/:id
 * Role: DOCTOR, ADMIN
 */
export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medicine = await getMedicineByIdService(Number(id));

    return res.json({
      success: true,
      data: medicine,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to get medicine";

    if (errorMessage === "MEDICINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Get low stock medicines
 * GET /api/medicines/low-stock
 * Role: ADMIN
 */
export const getLowStockMedicines = async (req: Request, res: Response) => {
  try {
    const medicines = await getLowStockMedicinesService();

    return res.json({
      success: true,
      data: medicines,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get low stock medicines",
    });
  }
};

/**
 * Get medicine import history
 * GET /api/medicines/:id/imports
 * Role: ADMIN
 */
export const getMedicineImportHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const imports = await getMedicineImportHistoryService(Number(id));

    return res.json({
      success: true,
      data: imports,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get import history",
    });
  }
};

/**
 * Get medicine export history
 * GET /api/medicines/:id/exports
 * Role: ADMIN
 */
export const getMedicineExportHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const exports = await getMedicineExportHistoryService(Number(id));

    return res.json({
      success: true,
      data: exports,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get export history",
    });
  }
};

/**
 * Mark medicine as expired
 * POST /api/medicines/:id/mark-expired
 * Role: ADMIN
 */
export const markMedicineAsExpired = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medicine = await markMedicineAsExpiredService(Number(id));

    return res.json({
      success: true,
      message: "Medicine marked as expired",
      data: medicine,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to mark medicine as expired";

    if (errorMessage === "MEDICINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Remove medicine from system
 * DELETE /api/medicines/:id
 * Role: ADMIN
 */
export const removeMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medicine = await removeMedicineService(Number(id));

    return res.json({
      success: true,
      message: "Medicine removed successfully",
      data: medicine,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to remove medicine";

    if (errorMessage === "MEDICINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    if (errorMessage === "CANNOT_REMOVE_MEDICINE_WITH_STOCK") {
      return res.status(400).json({
        success: false,
        message: "Cannot remove medicine with remaining stock",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Get medicines expiring soon (within specified days)
 * GET /api/medicines/expiring?days=30
 * Role: ADMIN
 */
export const getExpiringMedicines = async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: "Invalid days parameter. Must be between 1 and 365.",
      });
    }

    const medicines = await getExpiringMedicinesService(days);

    return res.json({
      success: true,
      message: `Found ${medicines.length} medicine(s) expiring within ${days} day(s)`,
      data: medicines,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get expiring medicines",
    });
  }
};

/**
 * Manually trigger auto-mark expired medicines
 * POST /api/medicines/auto-mark-expired
 * Role: ADMIN
 */
export const autoMarkExpired = async (req: Request, res: Response) => {
  try {
    const result = await autoMarkExpiredMedicinesService();

    return res.json({
      success: true,
      message: `Marked ${result.markedCount} medicine(s) as expired`,
      data: {
        count: result.markedCount,
        medicines: result.medicines,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to auto-mark expired medicines",
    });
  }
};
