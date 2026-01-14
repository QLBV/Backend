import { Request } from "express";
import AuditLog, { AuditAction } from "../models/AuditLog";
import User from "../models/User";
import { Op } from "sequelize";

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: {
  userId?: number;
  action: AuditAction;
  tableName: string;
  recordId?: number;
  oldValue?: object;
  newValue?: object;
  ipAddress?: string;
  userAgent?: string;
}) => {
  return await AuditLog.create({
    userId: data.userId,
    action: data.action,
    tableName: data.tableName,
    recordId: data.recordId,
    oldValue: data.oldValue,
    newValue: data.newValue,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    timestamp: new Date(),
  });
};

/**
 * Helper to extract IP and User Agent from request
 */
export const getRequestMetadata = (req: Request) => {
  const ipAddress =
    (req.headers["x-forwarded-for"] as string) ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "";

  const userAgent = req.headers["user-agent"] || "";

  return {
    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    userAgent,
  };
};

/**
 * Log a CREATE action
 */
export const logCreate = async (
  req: Request,
  tableName: string,
  recordId: number,
  newValue: object
) => {
  const { ipAddress, userAgent } = getRequestMetadata(req);
  const userId = req.user?.userId;

  return await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    tableName,
    recordId,
    newValue,
    ipAddress,
    userAgent,
  });
};

/**
 * Log an UPDATE action
 */
export const logUpdate = async (
  req: Request,
  tableName: string,
  recordId: number,
  oldValue: object,
  newValue: object
) => {
  const { ipAddress, userAgent } = getRequestMetadata(req);
  const userId = req.user?.userId;

  return await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    tableName,
    recordId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
  });
};

/**
 * Log a DELETE action
 */
export const logDelete = async (
  req: Request,
  tableName: string,
  recordId: number,
  oldValue: object
) => {
  const { ipAddress, userAgent } = getRequestMetadata(req);
  const userId = req.user?.userId;

  return await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    tableName,
    recordId,
    oldValue,
    ipAddress,
    userAgent,
  });
};

/**
 * Log a VIEW action (for sensitive data)
 */
export const logView = async (
  req: Request,
  tableName: string,
  recordId: number
) => {
  const { ipAddress, userAgent } = getRequestMetadata(req);
  const userId = req.user?.userId;

  return await createAuditLog({
    userId,
    action: AuditAction.VIEW,
    tableName,
    recordId,
    ipAddress,
    userAgent,
  });
};

/**
 * Log an EXPORT action
 */
export const logExport = async (
  req: Request,
  tableName: string,
  recordId?: number,
  metadata?: object
) => {
  const { ipAddress, userAgent } = getRequestMetadata(req);
  const userId = req.user?.userId;

  return await createAuditLog({
    userId,
    action: AuditAction.EXPORT,
    tableName,
    recordId,
    newValue: metadata,
    ipAddress,
    userAgent,
  });
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters: {
  page?: number;
  limit?: number;
  userId?: number;
  action?: AuditAction;
  tableName?: string;
  recordId?: number;
  fromDate?: Date;
  toDate?: Date;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.tableName) {
    where.tableName = filters.tableName;
  }

  if (filters.recordId) {
    where.recordId = filters.recordId;
  }

  if (filters.fromDate || filters.toDate) {
    where.timestamp = {};
    if (filters.fromDate) {
      where.timestamp[Op.gte] = filters.fromDate;
    }
    if (filters.toDate) {
      where.timestamp[Op.lte] = filters.toDate;
    }
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email"],
      },
    ],
    order: [["timestamp", "DESC"]],
    limit,
    offset,
  });

  return {
    logs: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Get audit trail for a specific record
 */
export const getRecordAuditTrail = async (
  tableName: string,
  recordId: number
) => {
  return await AuditLog.findAll({
    where: {
      tableName,
      recordId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email"],
      },
    ],
    order: [["timestamp", "ASC"]],
  });
};

export const getUserActivity = async (
  userId: number,
  limit: number = 100
) => {
  return await AuditLog.findAll({
    where: { userId },
    order: [["timestamp", "DESC"]],
    limit,
  });
};

export const auditLogService = {
  createAuditLog,
  getRequestMetadata,
  logCreate,
  logUpdate,
  logDelete,
  logView,
  logExport,
  getAuditLogs,
  getRecordAuditTrail,
  getUserActivity,
};
