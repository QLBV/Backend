import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

/**
 * Standardized error response format:
 * {
 *   success: false,
 *   message: "ERROR_CODE" or "Human readable message",
 *   error?: {
 *     code: "ERROR_CODE",
 *     message: "Human readable message",
 *     details?: any
 *   }
 * }
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.userId,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Handle validation errors (express-validator)
  if (err.array && typeof err.array === "function") {
    const validationErrors = err.array();
    return res.status(400).json({
      success: false,
      message: "VALIDATION_ERROR",
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: validationErrors,
      },
    });
  }

  // Handle Sequelize errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "VALIDATION_ERROR",
      error: {
        code: "VALIDATION_ERROR",
        message: "Database validation failed",
        details: err.errors?.map((e: any) => ({
          field: e.path,
          message: e.message,
        })),
      },
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "DUPLICATE_ENTRY",
      error: {
        code: "DUPLICATE_ENTRY",
        message: "Record already exists",
        details: err.errors?.[0]?.message,
      },
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "FOREIGN_KEY_CONSTRAINT",
      error: {
        code: "FOREIGN_KEY_CONSTRAINT",
        message: "Referenced record does not exist",
      },
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "INVALID_TOKEN",
      error: {
        code: "INVALID_TOKEN",
        message: err.message || "Invalid or expired token",
      },
    });
  }

  // Fallback for unknown errors
  const isDevelopment = process.env.NODE_ENV === "development";
  return res.status(500).json({
    success: false,
    message: "INTERNAL_SERVER_ERROR",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isDevelopment ? err.message : "An internal server error occurred",
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};
