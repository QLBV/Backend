import { Request, Response } from "express";
import {
  getDashboardDataService,
  getDashboardStatsService,
  getDashboardAppointmentsByDateService,
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