import { Request, Response } from "express";
import DoctorShift from "../models/DoctorShift";
import Doctor from "../models/Doctor";
import Shift from "../models/Shift";
import { cancelDoctorShiftAndReschedule } from "../services/appointmentReschedule.service";

export const assignDoctorToShift = async (req: Request, res: Response) => {
  try {
    const doctorId = Number(req.body.doctorId);
    const shiftId = Number(req.body.shiftId);
    const workDate = String(req.body.workDate || "").trim(); // YYYY-MM-DD

    if (!doctorId || !shiftId || !workDate) {
      return res.status(400).json({
        success: false,
        message: "Missing doctorId/shiftId/workDate",
      });
    }

    // Bonus: check format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
      return res.status(400).json({
        success: false,
        message: "workDate must be YYYY-MM-DD",
      });
    }

    // Bonus: check doctor/shift exists (ăn điểm)
    const [doctor, shift] = await Promise.all([
      Doctor.findByPk(doctorId),
      Shift.findByPk(shiftId),
    ]);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    if (!shift)
      return res
        .status(404)
        .json({ success: false, message: "Shift not found" });

    // Tạo trực tiếp, nếu trùng DB sẽ chặn
    const doctorShift = await DoctorShift.create({
      doctorId,
      shiftId,
      workDate,
    });

    return res.status(201).json({ success: true, data: doctorShift });
  } catch (error: any) {
    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Doctor already assigned to this shift on this date",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Assign doctor to shift failed",
      error: error?.message || error,
    });
  }
};

export const unassignDoctorFromShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cancelReason = req.body.cancelReason || "Admin unassigned doctor from shift";

    // Validate doctorShift exists
    const doctorShift = await DoctorShift.findByPk(id);
    if (!doctorShift) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Use official reschedule service with transaction safety
    const result = await cancelDoctorShiftAndReschedule(
      Number(id),
      cancelReason
    );

    // Return detailed result
    return res.json({
      success: true,
      message: "Doctor unassigned from shift successfully",
      data: {
        totalAppointments: result.totalAppointments,
        rescheduledCount: result.rescheduledCount,
        failedCount: result.failedCount,
        details: result.details,
      },
    });
  } catch (error: any) {
    // Handle specific errors
    const errorMessage = error?.message || "Unassign doctor from shift failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error?.message || error,
    });
  }
};

export const getShiftsByDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const shifts = await DoctorShift.findAll({
      where: { doctorId },
      include: [{ model: Shift, as: "shift" }],
      order: [["workDate", "DESC"]],
    });
    return res.json({ success: true, data: shifts });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Get shifts by doctor failed", error });
  }
};

export const getDoctorsOnDuty = async (req: Request, res: Response) => {
  try {
    const shiftId = req.query.shiftId ? Number(req.query.shiftId) : undefined;
    const workDate = req.query.workDate
      ? String(req.query.workDate)
      : undefined;

    if (!shiftId || !workDate) {
      return res
        .status(400)
        .json({ success: false, message: "Missing shiftId or workDate" });
    }

    const doctors = await DoctorShift.findAll({
      where: { shiftId, workDate },
      include: [
        { model: Doctor, as: "doctor" },
        { model: Shift, as: "shift" },
      ],
    });
    return res.json({ success: true, data: doctors });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Get doctors on duty failed", error });
  }
};
