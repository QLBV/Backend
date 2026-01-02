import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import Shift from "../models/Shift";

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

  return Appointment.findAll({
    where,
    include: [
      { model: Patient, as: "patient" },
      { model: Doctor, as: "doctor" },
      { model: Shift, as: "shift" },
    ],
    order: [["date", "ASC"], ["shiftId", "ASC"], ["slotNumber", "ASC"]],
  });
};
