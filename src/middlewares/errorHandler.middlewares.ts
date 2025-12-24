import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.code });
  }
  // fallback
  return res
    .status(500)
    .json({ message: err?.message || "INTERNAL_SERVER_ERROR" });
};
