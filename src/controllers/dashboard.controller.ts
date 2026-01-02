import { Request, Response } from "express";
import {
  getDashboardDataService,
  getDashboardStatsService,
  getDashboardAppointmentsByDateService,
  getDashboardOverviewService,
  getRecentActivitiesService,
  getQuickStatsService,
  getSystemAlertsService,
} from "../services/dashboard.service";

/**
 * Get dashboard realtime data
 * GET /api/dashboard
 * Role: ADMIN
 */
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardDataService();

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

/**
 * Get dashboard statistics overview
 * GET /api/dashboard/stats
 * Role: ADMIN
 */
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

/**
 * Get appointments for a specific date (calendar widget)
 * GET /api/dashboard/appointments/:date
 * Role: ADMIN
 */
export const getDashboardAppointmentsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
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

/**
 * Dashboard overview (quick summary cards)
 * GET /api/dashboard/overview
 * Role: ADMIN
 */
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

/**
 * Recent activities for dashboard feed
 * GET /api/dashboard/recent-activities
 * Role: ADMIN
 */
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

/**
 * Quick stats for dashboard
 * GET /api/dashboard/quick-stats
 * Role: ADMIN
 */
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

/**
 * System alerts for dashboard
 * GET /api/dashboard/alerts
 * Role: ADMIN
 */
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
