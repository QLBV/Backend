import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import Shift from "../models/Shift";
import User from "../models/User";
import Specialty from "../models/Specialty";

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
    ],
    order: [["date", "ASC"], ["shiftId", "ASC"], ["slotNumber", "ASC"]],
  });

  // Debug: Log first appointment to check data structure
  if (appointments.length > 0) {
    const first = appointments[0];
    console.log("🔍 First appointment data:", {
      id: first.id,
      doctorId: first.doctorId,
      hasDoctor: !!first.doctor,
      doctorUserId: first.doctor?.userId,
      hasDoctorUser: !!first.doctor?.user,
      doctorUserName: first.doctor?.user?.fullName,
      patientId: first.patientId,
      hasPatient: !!first.patient,
      hasPatientUser: !!first.patient?.user,
      patientUserName: first.patient?.user?.fullName,
    });
  }

  // Serialize appointments to ensure nested associations are properly included
  // Use toJSON() to properly serialize Sequelize instances
  return appointments.map(apt => {
    const json = apt.toJSON ? apt.toJSON() : apt;
    return json;
  });
};
