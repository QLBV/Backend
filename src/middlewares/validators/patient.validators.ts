import { body } from "express-validator";
import { validate } from "./validate";

export const setupPatientValidator = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("FULLNAME_INVALID"),

  body("gender")
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("GENDER_INVALID"),

  body("dateOfBirth")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("DOB_INVALID")
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      if (age < 0 || age > 150) {
        throw new Error("DOB_INVALID_RANGE");
      }
      return true;
    }),

  body("cccd")
    .matches(/^\d{12}$/)
    .withMessage("CCCD_INVALID"),

  body("profiles").isArray({ min: 1 }).withMessage("PROFILES_REQUIRED"),

  body("profiles.*.type")
    .isIn(["email", "phone", "address"])
    .withMessage("PROFILE_TYPE_INVALID"),

  body("profiles.*.value")
    .trim()
    .notEmpty()
    .withMessage("PROFILE_VALUE_REQUIRED"),

  validate,
];

export const updatePatientValidator = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("FULLNAME_INVALID"),

  body("gender")
    .optional()
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("GENDER_INVALID"),

  body("dateOfBirth")
    .optional()
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("DOB_INVALID"),

  validate,
];
