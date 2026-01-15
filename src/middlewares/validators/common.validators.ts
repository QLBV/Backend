import { Request, Response, NextFunction } from "express";

export const validateNumericId = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!value) {
      return res.status(400).json({
        success: false,
        message: `MISSING_PARAMETER`,
        details: `Required parameter '${paramName}' is missing`,
      });
    }
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue <= 0 || !Number.isInteger(numericValue)) {
      return res.status(400).json({
        success: false,
        message: "INVALID_ID",
        details: `Parameter '${paramName}' must be a positive integer`,
      });
    }
    (req.params as any)[`${paramName}Numeric`] = numericValue;
    next();
  };
};
export const validateNumericIds = (paramNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `MISSING_PARAMETER`,
          details: `Required parameter '${paramName}' is missing`,
        });
      }
      const numericValue = Number(value);
      if (isNaN(numericValue) || numericValue <= 0 || !Number.isInteger(numericValue)) {
        return res.status(400).json({
          success: false,
          message: "INVALID_ID",
          details: `Parameter '${paramName}' must be a positive integer`,
        });
      }
      (req.params as any)[`${paramName}Numeric`] = numericValue;
    }
    next();
  };
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page, limit } = req.query;
  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum)) {
      return res.status(400).json({
        success: false,
        message: "INVALID_PAGINATION",
        details: "Page must be a positive integer",
      });
    }
  }


  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000 || !Number.isInteger(limitNum)) {
      return res.status(400).json({
        success: false,
        message: "INVALID_PAGINATION",
        details: "Limit must be a positive integer between 1 and 1000",
      });
    }
  }
  next();
};
