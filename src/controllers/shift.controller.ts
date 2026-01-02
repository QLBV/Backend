import { Request, Response } from "express";
import Shift from "../models/Shift";
import DoctorShift from "../models/DoctorShift";
import Doctor from "../models/Doctor";
import User from "../models/User";
import Specialty from "../models/Specialty";

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const shifts = await Shift.findAll();
    return res.json({ success: true, data: shifts });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Get shifts failed", error });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByPk(id);
    if (!shift)
      return res
        .status(404)
        .json({ success: false, message: "Shift not found" });
    return res.json({ success: true, data: shift });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Get shift failed", error });
  }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime } = req.body;
    const shift = await Shift.create({ name, startTime, endTime });
    return res.status(201).json({ success: true, data: shift });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Create shift failed", error });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime } = req.body;
    const shift = await Shift.findByPk(id);
    if (!shift)
      return res
        .status(404)
        .json({ success: false, message: "Shift not found" });
    await shift.update({ name, startTime, endTime });
    return res.json({ success: true, data: shift });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Update shift failed", error });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByPk(id);
    if (!shift)
      return res
        .status(404)
        .json({ success: false, message: "Shift not found" });
    await shift.destroy();
    return res.json({ success: true, message: "Shift deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Delete shift failed", error });
  }
};

/**
 * Get full shift schedule (calendar view)
 * GET /api/shifts/schedule?startDate=2026-01-01&endDate=2026-01-31
 * Role: PUBLIC/AUTHENTICATED
 */
export const getShiftSchedule = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required (format: YYYY-MM-DD)",
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate as string) || !dateRegex.test(endDate as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Get all shifts
    const shifts = await Shift.findAll();

    // Get all doctor shifts within the date range
    const doctorShifts = await DoctorShift.findAll({
      where: {
        workDate: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      include: [
        {
          model: Shift,
          as: "shift",
        },
        {
          model: Doctor,
          as: "doctor",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "phoneNumber"],
            },
            {
              model: Specialty,
              as: "specialty",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["workDate", "ASC"]],
    });

    // Group by date and shift
    const scheduleMap = new Map<string, any>();

    doctorShifts.forEach((ds: any) => {
      const date = ds.workDate;
      const shiftId = ds.shiftId;
      const key = `${date}_${shiftId}`;

      if (!scheduleMap.has(key)) {
        scheduleMap.set(key, {
          date,
          shift: {
            id: ds.shift?.id,
            name: ds.shift?.name,
            startTime: ds.shift?.startTime,
            endTime: ds.shift?.endTime,
          },
          doctors: [],
        });
      }

      scheduleMap.get(key).doctors.push({
        doctorShiftId: ds.id,
        doctorId: ds.doctor?.id,
        doctorName: ds.doctor?.user?.fullName,
        doctorEmail: ds.doctor?.user?.email,
        specialty: ds.doctor?.specialty?.name,
        specialtyId: ds.doctor?.specialty?.id,
      });
    });

    // Convert map to array and sort
    const schedule = Array.from(scheduleMap.values()).sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.shift.id - b.shift.id;
    });

    return res.json({
      success: true,
      message: "Shift schedule retrieved successfully",
      data: {
        startDate,
        endDate,
        shifts: shifts.map((s) => ({
          id: s.id,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        schedule,
        totalEntries: schedule.length,
      },
    });
  } catch (error) {
    console.error("Get shift schedule error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get shift schedule",
      error,
    });
  }
};
