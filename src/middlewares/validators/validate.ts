import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Middleware xử lý kết quả validation từ express-validator
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];

    // Type guard để check xem có phải FieldValidationError không
    const field = 'path' in firstError ? firstError.path : undefined;

    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: field
    });
  }

  next();
};
