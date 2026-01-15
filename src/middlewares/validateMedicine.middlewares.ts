import { Request, Response, NextFunction } from "express";
import { MedicineUnit } from "../models/Medicine";


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

  const expiryDateObj = new Date(expiryDate);
  if (isNaN(expiryDateObj.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid expiry date format",
    });
  }

  next();
};

export const validateUpdateMedicine = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { unit, importPrice, salePrice, expiryDate } = req.body;
  if (unit && !Object.values(MedicineUnit).includes(unit)) {
    return res.status(400).json({
      success: false,
      message: `Invalid unit. Must be one of: ${Object.values(MedicineUnit).join(", ")}`,
    });
  }

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
