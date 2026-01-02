import { Request, Response } from "express";
import Attendance, { AttendanceStatus } from "../models/Attendance";
import User from "../models/User";
import { RoleCode } from "../constant/role";
import { Op } from "sequelize";

// POST /api/attendance/check-in - Check in
export const checkIn = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split("T")[0];

    // Check if already checked in today
    const existing = await Attendance.findOne({
      where: {
        userId,
        date: today,
      },
    });

    if (existing) {
      if (existing.checkInTime) {
        return res.status(400).json({
          success: false,
          message: "ALREADY_CHECKED_IN_TODAY",
        });
      }
      // Update existing record
      existing.checkInTime = new Date();
      existing.status = AttendanceStatus.PRESENT;
      await existing.save();

      return res.json({
        success: true,
        message: "CHECK_IN_SUCCESS",
        data: existing,
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      userId,
      date: new Date(today),
      checkInTime: new Date(),
      status: AttendanceStatus.PRESENT,
    });

    return res.json({
      success: true,
      message: "CHECK_IN_SUCCESS",
      data: attendance,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/attendance/check-out - Check out
export const checkOut = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
      },
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "NO_CHECK_IN_RECORD_TODAY",
      });
    }

    if (!attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "MUST_CHECK_IN_FIRST",
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "ALREADY_CHECKED_OUT",
      });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    return res.json({
      success: true,
      message: "CHECK_OUT_SUCCESS",
      data: attendance,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/attendance/my - Get my attendance records
export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate, limit = 30 } = req.query;

    const where: any = { userId };

    if (startDate) {
      where.date = { ...where.date, [Op.gte]: new Date(startDate as string) };
    }
    if (endDate) {
      where.date = { ...where.date, [Op.lte]: new Date(endDate as string) };
    }

    const records = await Attendance.findAll({
      where,
      order: [["date", "DESC"]],
      limit: Number(limit),
    });

    return res.json({
      success: true,
      data: records,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/attendance - Get all attendance (admin/receptionist)
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate, status, limit = 100 } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = Number(userId);
    }
    if (startDate) {
      where.date = { ...where.date, [Op.gte]: new Date(startDate as string) };
    }
    if (endDate) {
      where.date = { ...where.date, [Op.lte]: new Date(endDate as string) };
    }
    if (status) {
      where.status = status;
    }

    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "fullName", "email", "roleId"],
        },
      ],
      order: [["date", "DESC"]],
      limit: Number(limit),
    });

    return res.json({
      success: true,
      data: records,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/attendance/:id - Update attendance record (admin)
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, checkInTime, checkOutTime } = req.body;

    const attendance = await Attendance.findByPk(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "ATTENDANCE_NOT_FOUND",
      });
    }

    if (status !== undefined) attendance.status = status;
    if (note !== undefined) attendance.note = note;
    if (checkInTime !== undefined) attendance.checkInTime = new Date(checkInTime);
    if (checkOutTime !== undefined) attendance.checkOutTime = new Date(checkOutTime);

    await attendance.save();

    return res.json({
      success: true,
      message: "ATTENDANCE_UPDATED",
      data: attendance,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/attendance/leave-request - Request leave
export const requestLeave = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { date, leaveType, reason } = req.body;

    // Validate date is in the future
    const leaveDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (leaveDate < today) {
      return res.status(400).json({
        success: false,
        message: "CANNOT_REQUEST_LEAVE_FOR_PAST_DATE",
      });
    }

    // Check if already exists
    const existing = await Attendance.findOne({
      where: {
        userId,
        date: leaveDate,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "ATTENDANCE_RECORD_ALREADY_EXISTS",
      });
    }

    // Determine leave status
    const status = leaveType === "sick" ? AttendanceStatus.SICK_LEAVE : AttendanceStatus.LEAVE;

    const attendance = await Attendance.create({
      userId,
      date: leaveDate,
      status,
      note: reason || "",
    });

    return res.json({
      success: true,
      message: "LEAVE_REQUEST_CREATED",
      data: attendance,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
