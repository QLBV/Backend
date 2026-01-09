import { body, query } from "express-validator";
import { validate } from "./validate";
import { PayrollStatus } from "../../models/Payroll";

/**
 * Validator for calculating payroll
 */
export const validateCalculatePayroll = [
  body("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12")
    .toInt(),

  body("year")
    .isInt({ min: 2020, max: 2100 })
    .withMessage("Year must be a valid year")
    .toInt(),

  body("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive number")
    .toInt(),

  body("calculateAll")
    .optional()
    .isBoolean()
    .withMessage("calculateAll must be a boolean"),

  validate,
];

/**
 * Validator for getting payrolls with filters
 */
export const validateGetPayrolls = [
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12")
    .toInt(),

  query("year")
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage("Year must be a valid year")
    .toInt(),

  query("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive number")
    .toInt(),

  query("status")
    .optional()
    .isIn(Object.values(PayrollStatus))
    .withMessage("Invalid payroll status"),

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

/**
 * Validator for getting payrolls by period
 */
export const validateGetPayrollsByPeriod = [
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12")
    .toInt(),

  query("year")
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage("Year must be a valid year")
    .toInt(),

  validate,
];
