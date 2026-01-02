import { body } from "express-validator";
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

  validate,
];
