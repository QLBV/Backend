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
  exportMedicineService,
  getAllMedicineImportsService,
  getAllMedicineExportsService,
  getMedicineImportByIdService,
  getMedicineExportByIdService,
} from "./medicine.service";


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


export const getAllMedicines = async (req: Request, res: Response) => {
  try {
    const { status, group, lowStock, search, page, limit } = req.query;

    const result = await getAllMedicinesService({
      status: status as any,
      group: group as string,
      lowStock: lowStock === "true",
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return res.json({
      success: true,
      data: result.medicines,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get medicines",
    });
  }
};


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


export const getExpiringMedicines = async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: "Invalid days parameter. Must be between 1 and 365.",
      });
    }

    const result = await getExpiringMedicinesService(days, { page, limit });

    return res.json({
      success: true,
      message: `Found ${result.total} medicine(s) expiring within ${days} day(s)`,
      data: result.medicines,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get expiring medicines",
    });
  }
};


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


export const exportMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, reason, note } = req.body;
    const userId = req.user!.userId;

    if (!quantity || !reason) {
      return res.status(400).json({
        success: false,
        message: "QUANTITY_AND_REASON_REQUIRED",
      });
    }

    const result = await exportMedicineService({
      medicineId: Number(id),
      quantity,
      reason,
      userId,
      note,
    });

    return res.json({
      success: true,
      message: "Medicine exported successfully",
      data: result,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to export medicine";

    if (errorMessage === "MEDICINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    if (errorMessage === "MEDICINE_NOT_ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Medicine is not active",
      });
    }

    if (errorMessage.includes("INSUFFICIENT_STOCK")) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};


export const getAllMedicineImports = async (req: Request, res: Response) => {
  try {
    const { page, limit, medicineId, startDate, endDate } = req.query;

    const result = await getAllMedicineImportsService({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      medicineId: medicineId ? parseInt(medicineId as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.json({
      success: true,
      data: result.imports,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get medicine imports",
    });
  }
};


export const getAllMedicineExports = async (req: Request, res: Response) => {
  try {
    const { page, limit, medicineId, reason, startDate, endDate } = req.query;

    const result = await getAllMedicineExportsService({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      medicineId: medicineId ? parseInt(medicineId as string) : undefined,
      reason: reason as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return res.json({
      success: true,
      data: result.exports,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get medicine exports",
    });
  }
};


export const getMedicineImportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const importRecord = await getMedicineImportByIdService(Number(id));

    return res.json({
      success: true,
      data: importRecord,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to get medicine import";

    if (errorMessage === "IMPORT_RECORD_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine import not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};


export const getMedicineExportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exportRecord = await getMedicineExportByIdService(Number(id));

    return res.json({
      success: true,
      data: exportRecord,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to get medicine export";

    if (errorMessage === "EXPORT_RECORD_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Medicine export not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};
