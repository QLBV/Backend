import { Request, Response } from "express";
import {
  getRevenueReportService,
  getExpenseReportService,
  getTopMedicinesReportService,
  getMedicineAlertsReportService,
  getPatientsByGenderReportService,
  getProfitReportService,
  getAppointmentReportService,
  getPatientStatisticsService,
} from "../services/report.service";
import {
  generateRevenueReportExcel,
  generateExpenseReportExcel,
  generateProfitReportExcel,
  generateAppointmentReportExcel,
  generatePatientStatisticsExcel,
} from "../services/reportExcel.service";
import {
  generateRevenueReportPDF,
  generateExpenseReportPDF,
  generateProfitReportPDF,
  generateTopMedicinesReportPDF,
  generatePatientsByGenderReportPDF,
  generateAppointmentReportPDF,
  generatePatientStatisticsPDF,
} from "../services/reportPDF.service";

export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const data = await getRevenueReportService({
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenseReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const data = await getExpenseReportService({
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopMedicinesReport = async (req: Request, res: Response) => {
  try {
    const { year, month, limit } = req.query;
    const data = await getTopMedicinesReportService({
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
      limit: limit ? Number(limit) : 10,
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedicineAlertsReport = async (req: Request, res: Response) => {
  try {
    const { daysUntilExpiry, minStock } = req.query;
    const data = await getMedicineAlertsReportService({
      daysUntilExpiry: daysUntilExpiry ? Number(daysUntilExpiry) : undefined,
      minStock: minStock ? Number(minStock) : undefined,
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientsByGenderReport = async (req: Request, res: Response) => {
  try {
    const data = await getPatientsByGenderReportService();
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfitReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const data = await getProfitReportService({
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenueReportPDF = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateRevenueReportPDF(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getRevenueReportExcel = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateRevenueReportExcel(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getExpenseReportPDF = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateExpenseReportPDF(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getExpenseReportExcel = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateExpenseReportExcel(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getProfitReportPDF = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateProfitReportPDF(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getTopMedicinesReportPDF = async (req: Request, res: Response) => {
  try {
    const { year, month, limit } = req.query;
    await generateTopMedicinesReportPDF(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
      limit: limit ? Number(limit) : 10,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getPatientsByGenderReportPDF = async (req: Request, res: Response) => {
  try {
    await generatePatientsByGenderReportPDF(res);
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getProfitReportExcel = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateProfitReportExcel(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getAppointmentReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const data = await getAppointmentReportService({
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientStatistics = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const data = await getPatientStatisticsService(year, month);
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppointmentReportPDF = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateAppointmentReportPDF(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getAppointmentReportExcel = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    await generateAppointmentReportExcel(res, {
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getPatientStatisticsPDF = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    await generatePatientStatisticsPDF(res, { year, month });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getPatientStatisticsExcel = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    await generatePatientStatisticsExcel(res, { year, month });
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
