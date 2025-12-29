import { body, query } from "express-validator";
import { validate } from "./validate";
import { AppointmentStatus } from "../../constant/appointment";

export const createAppointmentValidator = [
  body("patientId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("PATIENT_ID_INVALID"),

  body("doctorId").isInt({ min: 1 }).withMessage("DOCTOR_ID_REQUIRED"),

  body("shiftId").isInt({ min: 1 }).withMessage("SHIFT_ID_REQUIRED"),

  body("date")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("DATE_INVALID")
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        throw new Error("DATE_IN_PAST");
      }
      return true;
    }),

  body("symptomInitial")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("SYMPTOM_TOO_LONG"),

  validate,
];

export const getAppointmentsValidator = [
  query("date")
    .optional()
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("DATE_INVALID"),

  query("doctorId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("DOCTOR_ID_INVALID"),

  query("shiftId").optional().isInt({ min: 1 }).withMessage("SHIFT_ID_INVALID"),

  query("status")
    .optional()
    .isIn(Object.values(AppointmentStatus))
    .withMessage("STATUS_INVALID"),

  validate,
];
