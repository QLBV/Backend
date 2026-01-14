import { Response } from "express";
import logger from "./logger";
import { ApiResponse } from "../types/common.types";

/**
 * Gửi response thành công
 * @param res - Express Response object
 * @param data - Dữ liệu trả về
 * @param message - Thông báo
 * @param statusCode - HTTP status code (mặc định 200)
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "SUCCESS",
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

/**
 * Gửi response lỗi
 * @param res - Express Response object
 * @param message - Thông báo lỗi
 * @param statusCode - HTTP status code (mặc định 500)
 * @param error - Error object (optional, sẽ được log)
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: unknown
): Response => {
  // Log error nếu có
  if (error) {
    logger.error(`[API Error] ${message}:`, error);
  }

  const response: ApiResponse = {
    success: false,
    message,
    error: process.env.NODE_ENV === "development" && error instanceof Error 
      ? error.message 
      : undefined,
  };
  return res.status(statusCode).json(response);
};

/**
 * Wrapper để bắt lỗi async trong controller
 * Giúp tránh try-catch lặp lại
 * @param fn - Async controller function
 */
export const asyncHandler = (
  fn: (req: any, res: Response, next: any) => Promise<any>
) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error("[asyncHandler] Unhandled error:", error);
      sendError(res, "INTERNAL_SERVER_ERROR", 500, error);
    });
  };
};

/**
 * Kiểm tra và parse ID từ params
 * @param id - ID string từ request params
 * @returns Số nguyên hoặc null nếu không hợp lệ
 */
export const parseId = (id: string): number | null => {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};

/**
 * Kiểm tra ID có hợp lệ không và trả về error response nếu không
 * @param res - Express Response object
 * @param id - ID string từ request params
 * @returns Số nguyên nếu hợp lệ, null nếu không (đã gửi response)
 */
export const validateId = (res: Response, id: string): number | null => {
  const parsed = parseId(id);
  if (!parsed) {
    sendError(res, "INVALID_ID", 400);
    return null;
  }
  return parsed;
};
