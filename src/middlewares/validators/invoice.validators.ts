import { body, query } from "express-validator";
import { validate } from "./validate";

/**
 * Validator for creating invoice
 */
export const validateCreateInvoice = [
  body("patientId")
    .isInt({ min: 1 })
    .withMessage("Patient ID must be a positive number"),

  body("doctorId")
    .isInt({ min: 1 })
    .withMessage("Doctor ID must be a positive number"),

  body("visitId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Visit ID must be a positive number"),

  body("items")
    .isArray({ min: 1 })
    .withMessage("Items must be an array with at least 1 item"),

  body("items.*.description")
    .notEmpty()
    .withMessage("Item description is required"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),

  body("items.*.unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Item unit price must be a positive number"),

  validate,
];

/**
 * Validator for updating invoice
 */
export const validateUpdateInvoice = [
  body("items")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Items must be an array with at least 1 item"),

  body("items.*.description")
    .optional()
    .notEmpty()
    .withMessage("Item description is required"),

  body("items.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),

  body("items.*.unitPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Item unit price must be a positive number"),

  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a non-negative number"),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Note must not exceed 1000 characters"),

  validate,
];

/**
 * Validator for adding payment to invoice
 */
export const validateAddPayment = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Payment amount must be greater than 0")
    .toFloat(),

  body("paymentMethod")
    .isIn(["CASH", "BANK_TRANSFER", "QR_CODE", "CREDIT_CARD"])
    .withMessage("Invalid payment method"),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note must not exceed 500 characters"),

  validate,
];

/**
 * Validator for getting invoices with filters
 */
export const validateGetInvoices = [
  query("patientId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Patient ID must be a positive number")
    .toInt(),

  query("status")
    .optional()
    .isIn(["UNPAID", "PARTIALLY_PAID", "PAID", "CANCELLED"])
    .withMessage("Invalid invoice status"),

  query("startDate")
    .optional()
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Start date must be in YYYY-MM-DD format"),

  query("endDate")
    .optional()
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("End date must be in YYYY-MM-DD format"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive number")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  validate,
];
