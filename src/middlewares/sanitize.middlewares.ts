import { Request, Response, NextFunction } from "express";
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize string input to prevent XSS attacks
 */
const sanitizeString = (value: any): string => {
  if (typeof value !== "string") {
    return value;
  }
  // Remove HTML tags and dangerous content
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
};

/**
 * Recursively sanitize object/array
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body
 * Prevents XSS attacks by removing HTML/script tags
 * 
 * Note: req.query and req.params are read-only in Express,
 * so we only sanitize req.body here. Query/params sanitization
 * should be done in individual route handlers if needed.
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize body (can be directly assigned)
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  // Note: req.query and req.params are read-only properties in Express
  // They are typically validated by express-validator instead of sanitized here
  // If sanitization is needed, do it in individual route handlers

  next();
};

/**
 * Sanitize specific fields (for cases where we want to allow some HTML)
 */
export const sanitizeField = (field: string, value: any): any => {
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  return value;
};
