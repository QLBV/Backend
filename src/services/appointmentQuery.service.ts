import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import Shift from "../models/Shift";
import User from "../models/User";
import Specialty from "../models/Specialty";
import { getDisplayStatus } from "../utils/statusMapper";

export const getAppointmentsService = async (q: {
  date?: string;
  doctorId?: number;
  shiftId?: number;
  status?: string;
  patientId?: number;
}) => {
  const where: any = {};

  if (q.date) where.date = q.date;
  if (q.doctorId) where.doctorId = q.doctorId;
  if (q.shiftId) where.shiftId = q.shiftId;
  if (q.status) where.status = q.status;
  if (q.patientId) where.patientId = q.patientId;

  const Visit = (await import("../models/Visit")).default;

  const appointments = await Appointment.findAll({
    where,
    include: [
      {
        model: Patient,
        as: "patient",
        required: false,
        include: [
          {
            model: User,
            as: "user",
            required: false,
            attributes: ["id", "fullName", "email", "avatar"],
          },
        ],
      },
      {
        model: Doctor,
        as: "doctor",
        required: false,
        include: [
          {
            model: User,
            as: "user",
            required: false,
            attributes: ["id", "fullName", "email", "avatar"],
          },
          {
            model: Specialty,
            as: "specialty",
            required: false,
            attributes: ["id", "name", "description"],
          },
        ],
      },
      {
        model: Shift,
        as: "shift",
        required: false,
        attributes: ["id", "name", "startTime", "endTime"],
      },
      {
        model: Visit,
        as: "visit",
        required: false,
        attributes: ["id", "checkInTime", "diagnosis", "status"],
      },
    ],
    order: [
      ["date", "ASC"],
      ["shiftId", "ASC"],
      ["slotNumber", "ASC"],
    ],
  });

  // Debug: Log first appointment to check data structure
  if (appointments.length > 0) {
    const first = appointments[0];
    console.log(
      "First appointment data:",
      first.toJSON ? first.toJSON() : first
    );
  }

  // Serialize appointments to ensure nested associations are properly included
  // Use toJSON() to properly serialize Sequelize instances
  // Add displayStatus field using statusMapper
  // Map symptomInitial to reason for frontend compatibility
  return appointments.map((apt) => {
    const json = apt.toJSON ? apt.toJSON() : apt;
    return {
      ...json,
      reason: json.symptomInitial, // Map symptomInitial to reason for frontend
      displayStatus: getDisplayStatus(
        { status: json.status },
        json.visit ? { status: json.visit.status } : null
      ),
    };
  });
};
