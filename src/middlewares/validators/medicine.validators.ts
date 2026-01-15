import { body, ValidationChain } from "express-validator";
import { validate } from "./validate";

export const validateExportMedicine: (ValidationChain | typeof validate)[] = [
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("QUANTITY_REQUIRED_AND_MUST_BE_POSITIVE")
    .toInt(),

  body("reason")
    .notEmpty()
    .withMessage("REASON_REQUIRED")
    .isIn([
      "EXPIRED",
      "DAMAGED",
      "TRANSFER",
      "RETURN_TO_SUPPLIER",
      "INVENTORY_ADJUSTMENT",
      "OTHER",
    ])
    .withMessage("INVALID_EXPORT_REASON"),

  body("note")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Note must not exceed 1000 characters"),

  validate,
];

export const validateImportMedicineEnhanced: (ValidationChain | typeof validate)[] = [
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("QUANTITY_REQUIRED_AND_MUST_BE_POSITIVE")
    .toInt(),

  body("importPrice")
    .isFloat({ min: 0 })
    .withMessage("IMPORT_PRICE_REQUIRED_AND_MUST_BE_NON_NEGATIVE")
    .toFloat(),

  body("supplier")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Supplier name must not exceed 255 characters"),

  body("supplierInvoice")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Supplier invoice must not exceed 100 characters"),

  body("batchNumber")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Batch number must not exceed 100 characters"),

  body("note")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Note must not exceed 1000 characters"),

  validate,
];
