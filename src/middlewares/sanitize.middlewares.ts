import { Request, Response, NextFunction } from "express";
import DOMPurify from "isomorphic-dompurify";

const sanitizeString = (value: any): string => {
  if (typeof value !== "string") {
    return value;
  }
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [], 
  });
};

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

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  
  
  

  next();
};


export const sanitizeField = (field: string, value: any): any => {
  if (typeof value === "string") {
    return sanitizeString(value);
  }
  return value;
};
