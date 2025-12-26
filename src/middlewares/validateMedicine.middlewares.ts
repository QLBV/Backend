import { Request, Response, NextFunction } from "express";
import { MedicineUnit } from "../models/Medicine";

/**
 * Validate create medicine request
 * Note: medicineCode is auto-generated, not required in request
 */
export const validateCreateMedicine = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    group,
    unit,
    importPrice,
    salePrice,
    quantity,
    expiryDate,
  } = req.body;

  // Check required fields
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Medicine name is required",
    });
  }

  if (!group) {
    return res.status(400).json({
      success: false,
      message: "Medicine group is required",
    });
  }

  if (!unit) {
    return res.status(400).json({
      success: false,
      message: "Unit is required",
    });
  }

  // Validate unit is valid enum value
  if (!Object.values(MedicineUnit).includes(unit)) {
    return res.status(400).json({
      success: false,
      message: `Invalid unit. Must be one of: ${Object.values(MedicineUnit).join(", ")}`,
    });
  }

  if (importPrice === undefined || importPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid import price is required",
    });
  }

  if (salePrice === undefined || salePrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid sale price is required",
    });
  }

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid quantity is required",
    });
  }

  if (!expiryDate) {
    return res.status(400).json({
      success: false,
      message: "Expiry date is required",
    });
  }

  // Validate expiry date is a valid date
  const expiryDateObj = new Date(expiryDate);
  if (isNaN(expiryDateObj.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid expiry date format",
    });
  }

  next();
};

/**
 * Validate update medicine request
 */
export const validateUpdateMedicine = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { unit, importPrice, salePrice, expiryDate } = req.body;

  // Validate unit if provided
  if (unit && !Object.values(MedicineUnit).includes(unit)) {
    return res.status(400).json({
      success: false,
      message: `Invalid unit. Must be one of: ${Object.values(MedicineUnit).join(", ")}`,
    });
  }

  // Validate prices if provided
  if (importPrice !== undefined && importPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Import price must be non-negative",
    });
  }

  if (salePrice !== undefined && salePrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Sale price must be non-negative",
    });
  }

  // Validate expiry date if provided
  if (expiryDate) {
    const expiryDateObj = new Date(expiryDate);
    if (isNaN(expiryDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiry date format",
      });
    }
  }

  next();
};

/**
 * Validate import medicine request
 */
export const validateImportMedicine = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { quantity, importPrice } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid quantity is required (must be greater than 0)",
    });
  }

  if (importPrice === undefined || importPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid import price is required",
    });
  }

  next();
};
