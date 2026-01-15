import { body } from "express-validator";
import { validate } from "./validate";

export const validateAssignDoctorShift = [
  body("doctorId")
    .isInt({ min: 1 })
    .withMessage("Doctor ID must be a positive number"),
  body("shiftId")
    .isInt({ min: 1 })
    .withMessage("Shift ID must be a positive number"),
  body("workDate")
    .isISO8601()
    .withMessage("Work date must be a valid date (YYYY-MM-DD)")
    .custom((value) => {
      const workDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (workDate < today) {
        throw new Error("Work date cannot be in the past");
      }
      return true;
    }),
  validate,
];

export const validateRescheduleShift = [
  body("replacementDoctorId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Replacement doctor ID must be a positive number"),
  body("reason").optional().isString().withMessage("Reason must be a string"),
  validate,
];
