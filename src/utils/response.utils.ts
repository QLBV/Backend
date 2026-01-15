import { Response } from "express";
import logger from "./logger";
import { ApiResponse } from "../types/common.types";


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


export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: unknown
): Response => {
  
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


export const parseId = (id: string): number | null => {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
};


export const validateId = (res: Response, id: string): number | null => {
  const parsed = parseId(id);
  if (!parsed) {
    sendError(res, "INVALID_ID", 400);
    return null;
  }
  return parsed;
};
