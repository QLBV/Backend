import { Request, Response, NextFunction } from "express";

/**
 * Async Handler Wrapper
 *
 * Wraps async route handlers to automatically catch errors
 * and pass them to Express error handling middleware
 *
 * Usage:
 * router.get("/endpoint", asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json({ success: true, data });
 * }));
 *
 * Without this wrapper, unhandled promise rejections in async
 * routes would not be caught by Express error middleware
 */

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
