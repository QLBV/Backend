import { Request, Response } from "express";
import { AttendanceService } from "../services/attendance.service";
import { AttendanceStatus } from "../models/Attendance";

export const checkIn = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await AttendanceService.checkIn(userId);

    return res.json({
      success: true,
      message: "CHECK_IN_SUCCESS",
      data: result,
    });
  } catch (e: any) {
    return res.status(e.message === "ALREADY_CHECKED_IN_TODAY" ? 400 : 500).json({
      success: false,
      message: e.message,
    });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await AttendanceService.checkOut(userId);

    return res.json({
      success: true,
      message: "CHECK_OUT_SUCCESS",
      data: result,
    });
  } catch (e: any) {
    const statusCode = ["NO_CHECK_IN_RECORD_TODAY", "MUST_CHECK_IN_FIRST", "ALREADY_CHECKED_OUT"].includes(e.message) ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: e.message,
    });
  }
};

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate, limit, page } = req.query;

    const result = await AttendanceService.getAttendance({
      userId,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    });

    return res.json({
      success: true,
      data: {
        attendances: result.records,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate, status, limit, page } = req.query;

    const result = await AttendanceService.getAttendance({
      userId: userId ? Number(userId) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as AttendanceStatus,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    });

    return res.json({
      success: true,
      data: {
        attendances: result.records,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, checkInTime, checkOutTime } = req.body;
    
    const result = await AttendanceService.updateAttendance(Number(id), {
      status,
      note,
      checkInTime,
      checkOutTime,
    });
    
    return res.json({
      success: true,
      message: "ATTENDANCE_UPDATED",
      data: result,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

export const requestLeave = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { date, leaveType, reason } = req.body;

    const result = await AttendanceService.requestLeave(userId, date, leaveType, reason);

    return res.json({
      success: true,
      message: "LEAVE_REQUEST_CREATED",
      data: result,
    });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

export const runAutoAbsence = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const count = await AttendanceService.autoMarkAbsence(date as string);

    return res.json({
      success: true,
      message: `Successfully marked ${count} users as absent.`,
      data: { count },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
