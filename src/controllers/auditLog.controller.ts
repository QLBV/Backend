import { Request, Response } from "express";
import {
  getAuditLogs,
  getRecordAuditTrail,
  getUserActivity,
} from "../services/auditLog.service";
import { AuditAction } from "../models/AuditLog";

/**
 * Get all audit logs with filters
 * GET /api/audit-logs
 * Role: ADMIN only
 */
export const getAllAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      userId,
      action,
      tableName,
      recordId,
      fromDate,
      toDate,
    } = req.query;

    const filters: any = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      userId: userId ? parseInt(userId as string) : undefined,
      action: action as AuditAction,
      tableName: tableName as string,
      recordId: recordId ? parseInt(recordId as string) : undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
    };

    const result = await getAuditLogs(filters);

    return res.json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve audit logs",
    });
  }
};

/**
 * Get audit trail for a specific record
 * GET /api/audit-logs/:tableName/:recordId
 * Role: ADMIN only
 */
export const getRecordAuditTrailController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tableName, recordId } = req.params;

    const logs = await getRecordAuditTrail(tableName, parseInt(recordId));

    return res.json({
      success: true,
      message: "Audit trail retrieved successfully",
      data: logs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve audit trail",
    });
  }
};

/**
 * Get user activity logs
 * GET /api/audit-logs/user/:userId
 * Role: ADMIN only
 */
export const getUserActivityController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const logs = await getUserActivity(
      parseInt(userId),
      limit ? parseInt(limit as string) : undefined
    );

    return res.json({
      success: true,
      message: "User activity retrieved successfully",
      data: logs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve user activity",
    });
  }
};

/**
 * Get my activity logs (for current logged-in user)
 * GET /api/audit-logs/me
 * Role: All authenticated users
 */
export const getMyActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { limit } = req.query;

    const logs = await getUserActivity(
      userId,
      limit ? parseInt(limit as string) : 50
    );

    return res.json({
      success: true,
      message: "Your activity retrieved successfully",
      data: logs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve your activity",
    });
  }
};
