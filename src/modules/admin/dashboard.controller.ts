import { Request, Response } from "express";
import {
  getDashboardDataService,
  getDashboardStatsService,
  getDashboardAppointmentsByDateService,
  getDashboardOverviewService,
  getRecentActivitiesService,
  getQuickStatsService,
  getSystemAlertsService,
  getLandingStatsService,
} from "./dashboard.service";

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const data = await getDashboardDataService(days, month, year);

    return res.json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get dashboard data",
    });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStatsService();

    return res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get dashboard statistics",
    });
  }
};


export const getDashboardAppointmentsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const appointments = await getDashboardAppointmentsByDateService(date);

    return res.json({
      success: true,
      message: `Appointments for ${date} retrieved successfully`,
      data: {
        date,
        count: appointments.length,
        appointments,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get appointments",
    });
  }
};

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardOverviewService();

    return res.json({
      success: true,
      message: "Dashboard overview retrieved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get dashboard overview",
    });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const limitParam = req.query.limit as string | undefined;
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
    const limit = Number.isFinite(parsedLimit) && parsedLimit! > 0 ? parsedLimit : 10;

    const data = await getRecentActivitiesService(limit);

    return res.json({
      success: true,
      message: "Recent activities retrieved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get recent activities",
    });
  }
};

export const getQuickStats = async (req: Request, res: Response) => {
  try {
    const data = await getQuickStatsService();

    return res.json({
      success: true,
      message: "Quick stats retrieved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get quick stats",
    });
  }
};

export const getSystemAlerts = async (req: Request, res: Response) => {
  try {
    const data = await getSystemAlertsService();

    return res.json({
      success: true,
      message: "System alerts retrieved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get system alerts",
    });
  }
};

export const getLandingStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const stats = await getLandingStatsService();
    return res.json({
      success: true,
      message: "Landing stats retrieved successfully",
      data: stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get landing stats",
    });
  }
};
