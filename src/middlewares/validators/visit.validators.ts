import { body } from "express-validator";
import { validate } from "./validate";

/**
 * Validator for completing visit
 */
export const validateCompleteVisit = [
  body("diagnosis")
    .notEmpty()
    .withMessage("Diagnosis is required")
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Diagnosis must be between 10 and 1000 characters"),

  body("diseaseCategoryId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Disease category ID must be a positive number"),

  body("examinationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Examination fee must be a positive number"),

  body("treatment")
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage("Treatment must not exceed 2000 characters"),

  body("note")
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage("Note must not exceed 2000 characters"),

  validate,
];

/**
 * Validator for check-in appointment
 */
export const validateCheckIn = [
  body("vitalSigns")
    .optional()
    .isObject()
    .withMessage("Vital signs must be an object"),

  body("vitalSigns.bloodPressure")
    .optional()
    .matches(/^\d{2,3}\/\d{2,3}$/)
    .withMessage("Blood pressure must be in format XXX/XX"),

  body("vitalSigns.heartRate")
    .optional()
    .isInt({ min: 40, max: 200 })
    .withMessage("Heart rate must be between 40-200 bpm"),

  body("vitalSigns.temperature")
    .optional()
    .isFloat({ min: 35, max: 43 })
    .withMessage("Temperature must be between 35-43°C"),

  body("vitalSigns.weight")
    .optional()
    .isFloat({ min: 0, max: 500 })
    .withMessage("Weight must be between 0-500 kg"),

  validate,
];
