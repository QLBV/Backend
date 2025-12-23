
import { Request, Response } from "express";
import {
  checkInAppointmentService,
  completeVisitService,
} from "../services/visit.service";

export const checkInAppointment = async (req: Request, res: Response) => {
  try {
    const visit = await checkInAppointmentService(
      Number(req.params.appointmentId)
    );

    res.json({
      success: true,
      message: "Check-in successful",
      data: visit,
    });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const completeVisit = async (req: Request, res: Response) => {
  try {
    const { diagnosis, note } = req.body;

    const visit = await completeVisitService(
      Number(req.params.id),
      diagnosis,
      note
    );

    res.json({
      success: true,
      message: "Visit completed",
      data: visit,
    });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};
