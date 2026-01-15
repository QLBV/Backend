import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const field = 'path' in firstError ? firstError.path : undefined;
    console.error(" Validation error:", {
      field,
      message: firstError.msg,
      value: 'value' in firstError ? firstError.value : undefined,
      allErrors: errors.array(),
    });
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: field,
      errors: errors.array(), 
    });
  }
  next();
};
