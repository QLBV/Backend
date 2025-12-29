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
  } catch (err: any) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "APPOINTMENT_ALREADY_CHECKED_IN" });
    }
    throw err;
  }
};

export const completeVisit = async (req: Request, res: Response) => {
  try {
    const { diagnosis, note, examinationFee } = req.body;
    const createdBy = (req as any).user.id;

    // Validate examinationFee
    if (!examinationFee || examinationFee <= 0) {
      return res.status(400).json({
        success: false,
        message: "examinationFee is required and must be greater than 0",
      });
    }

    const result = await completeVisitService(
      Number(req.params.id),
      diagnosis,
      parseFloat(examinationFee),
      createdBy,
      note
    );

    // Kiểm tra nếu có lỗi khi tạo invoice
    if (result.invoiceError) {
      return res.json({
        success: true,
        message: "Visit completed but invoice creation failed",
        data: result.visit,
        warning: result.invoiceError,
      });
    }

    res.json({
      success: true,
      message: "Visit completed and invoice created",
      data: {
        visit: result.visit,
        invoice: result.invoice,
      },
    });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};
