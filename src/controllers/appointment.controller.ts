import { Request, Response } from "express";
import { createAppointmentService } from "../services/appointment.service";
import { RoleCode } from "../constant/role";

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { doctorId, shiftId, date, bookingType, symptomInitial } = req.body;

    const bookedBy =
      req.user!.roleId === RoleCode.PATIENT ? "PATIENT" : "RECEPTIONIST";

    const appointment = await createAppointmentService({
      patientId: req.user!.patientId!,
      doctorId,
      shiftId,
      date,
      bookingType,
      bookedBy,
      symptomInitial,
    });

    res.json({
      success: true,
      message: "APPOINTMENT_CREATED",
      data: appointment,
    });
  } catch (e: any) {
    const map: Record<string, string> = {
      DOCTOR_NOT_ON_DUTY: "Bác sĩ không trực ca này",
      SHIFT_FULL: "Ca khám đã đủ 40 lượt",
    };

    res.status(400).json({
      success: false,
      message: map[e.message] || e.message,
    });
  }
};
