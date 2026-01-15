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

  validate, 
];

export const loginValidator = [
  body("email").isEmail().withMessage("EMAIL_INVALID").normalizeEmail().trim(),

  body("password").notEmpty().withMessage("PASSWORD_REQUIRED"),

  validate,
];

export const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Email không hợp lệ"),
  validate,
];

export const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Reset token là bắt buộc"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải ≥ 6 ký tự")
    .matches(/[A-Z]/)
    .withMessage("Mật khẩu phải có chữ hoa")
    .matches(/[a-z]/)
    .withMessage("Mật khẩu phải có chữ thường")
    .matches(/[0-9]/)
    .withMessage("Mật khẩu phải có số"),
  validate,
];
