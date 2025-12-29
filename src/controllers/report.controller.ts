import { Request, Response } from "express";
import {
  getRevenueReportService,
  getExpenseReportService,
  getTopMedicinesReportService,
  getMedicineAlertsReportService,
  getPatientsByGenderReportService,
  getProfitReportService,
} from "../services/report.service";
import {
  generateRevenueReportPDF,
  generateExpenseReportPDF,
  generateProfitReportPDF,
  generateTopMedicinesReportPDF,
  generatePatientsByGenderReportPDF,
} from "../services/reportPDF.service";

/**
 * Get revenue report
 * GET /api/reports/revenue?year=2025&month=12
 * Role: ADMIN
 */
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    const report = await getRevenueReportService({ year, month });

    return res.json({
      success: true,
      message: "Revenue report retrieved successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get revenue report",
    });
  }
};

/**
 * Get expense report
 * GET /api/reports/expense?year=2025&month=12
 * Role: ADMIN
 */
export const getExpenseReport = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    const report = await getExpenseReportService({ year, month });

    return res.json({
      success: true,
      message: "Expense report retrieved successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get expense report",
    });
  }
};

/**
 * Get top medicines report
 * GET /api/reports/top-medicines?year=2025&month=12&limit=10
 * Role: ADMIN
 */
export const getTopMedicinesReport = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive number",
      });
    }

    const report = await getTopMedicinesReportService({ year, month, limit });

    return res.json({
      success: true,
      message: "Top medicines report retrieved successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get top medicines report",
    });
  }
};

/**
 * Get medicine alerts report
 * GET /api/reports/medicine-alerts?daysUntilExpiry=30&minStock=10
 * Role: ADMIN
 */
export const getMedicineAlertsReport = async (req: Request, res: Response) => {
  try {
    const daysUntilExpiry = req.query.daysUntilExpiry
      ? parseInt(req.query.daysUntilExpiry as string)
      : 30;
    const minStock = req.query.minStock ? parseInt(req.query.minStock as string) : 10;

    if (isNaN(daysUntilExpiry) || daysUntilExpiry < 0) {
      return res.status(400).json({
        success: false,
        message: "daysUntilExpiry must be a non-negative number",
      });
    }

    if (isNaN(minStock) || minStock < 0) {
      return res.status(400).json({
        success: false,
        message: "minStock must be a non-negative number",
      });
    }

    const report = await getMedicineAlertsReportService({ daysUntilExpiry, minStock });

    return res.json({
      success: true,
      message: "Medicine alerts report retrieved successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get medicine alerts report",
    });
  }
};

/**
 * Get patients by gender report
 * GET /api/reports/patients-by-gender
 * Role: ADMIN
 */
export const getPatientsByGenderReport = async (req: Request, res: Response) => {
  try {
    const report = await getPatientsByGenderReportService();

    return res.json({
      success: true,
      message: "Patients by gender report retrieved successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get patients by gender report",
    });
  }
};

/**
 * Get profit report
 * GET /api/reports/profit?year=2025&month=12
 * Role: ADMIN
 */
export const getProfitReport = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    const report = await getProfitReportService({ year, month });

    return res.json({
      success: true,
      message: "Profit report retrieved successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get profit report",
    });
  }
};

/**
 * Get revenue report as PDF
 * GET /api/reports/revenue/pdf?year=2025&month=12
 * Role: ADMIN
 */
export const getRevenueReportPDF = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    await generateRevenueReportPDF(res, { year, month });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate revenue report PDF",
    });
  }
};

/**
 * Get expense report as PDF
 * GET /api/reports/expense/pdf?year=2025&month=12
 * Role: ADMIN
 */
export const getExpenseReportPDF = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    await generateExpenseReportPDF(res, { year, month });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate expense report PDF",
    });
  }
};

/**
 * Get profit report as PDF
 * GET /api/reports/profit/pdf?year=2025&month=12
 * Role: ADMIN
 */
export const getProfitReportPDF = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    await generateProfitReportPDF(res, { year, month });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate profit report PDF",
    });
  }
};

/**
 * Get top medicines report as PDF
 * GET /api/reports/top-medicines/pdf?year=2025&month=12&limit=10
 * Role: ADMIN
 */
export const getTopMedicinesReportPDF = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!year || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: "Year is required and must be a valid number",
      });
    }

    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      });
    }

    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive number",
      });
    }

    await generateTopMedicinesReportPDF(res, { year, month, limit });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate top medicines report PDF",
    });
  }
};

/**
 * Get patients by gender report as PDF
 * GET /api/reports/patients-by-gender/pdf
 * Role: ADMIN
 */
export const getPatientsByGenderReportPDF = async (req: Request, res: Response) => {
  try {
    await generatePatientsByGenderReportPDF(res);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate patients by gender report PDF",
    });
  }
};