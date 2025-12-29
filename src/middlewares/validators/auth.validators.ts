import { body } from "express-validator";
import { validate } from "./validate";

export const registerValidator = [
  body("email").isEmail().withMessage("EMAIL_INVALID").normalizeEmail().trim(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("PASSWORD_TOO_SHORT")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("PASSWORD_WEAK"),

  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("FULLNAME_INVALID"),

  validate, // Middleware xử lý kết quả validation
];

export const loginValidator = [
  body("email").isEmail().withMessage("EMAIL_INVALID").normalizeEmail().trim(),

  body("password").notEmpty().withMessage("PASSWORD_REQUIRED"),

  validate,
];
