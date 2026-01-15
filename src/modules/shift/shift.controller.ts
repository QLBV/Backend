import { Request, Response } from "express";
import { Op } from "sequelize";
import Shift from "../../models/Shift";
import DoctorShift from "../../models/DoctorShift";
import Doctor from "../../models/Doctor";
import User from "../../models/User";
import Specialty from "../../models/Specialty";
import { CacheService, CacheKeys } from "../../services/cache.service";

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    
    const cachedShifts = await CacheService.get(CacheKeys.SHIFTS);
    if (cachedShifts) {
      return res.json({ success: true, data: cachedShifts });
    }

    
    const shifts = await Shift.findAll({
      order: [["id", "ASC"]],
    });

    
    await CacheService.set(CacheKeys.SHIFTS, shifts, 3600);

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
    
    
    await CacheService.invalidate(CacheKeys.SHIFTS);
    
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
    
    
    await CacheService.invalidate(CacheKeys.SHIFTS);
    
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
    
    
    await CacheService.invalidate(CacheKeys.SHIFTS);
    
    return res.json({ success: true, message: "Shift deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Delete shift failed", error });
  }
};


export const getShiftSchedule = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required (format: YYYY-MM-DD)",
      });
    }

    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate as string) || !dateRegex.test(endDate as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    
    const shifts = await Shift.findAll({
       order: [["startTime", "ASC"]]
    });

    
    const doctorShifts = await DoctorShift.findAll({
      where: {
        workDate: {
          [Op.between]: [startDate as string, endDate as string],
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
              attributes: ["id", "fullName", "email"],
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

    
    const dates: string[] = [];
    const currDate = new Date(startDate as string);
    const lastDate = new Date(endDate as string);
    
    
    let daysCount = 0;
    while (currDate <= lastDate && daysCount < 365) {
      dates.push(currDate.toISOString().slice(0, 10));
      currDate.setDate(currDate.getDate() + 1);
      daysCount++;
    }

    
    const assignmentsMap = new Map<string, any[]>();
    doctorShifts.forEach((ds: any) => {
        const key = `${ds.workDate}_${ds.shiftId}`;
        if (!assignmentsMap.has(key)) {
            assignmentsMap.set(key, []);
        }
        assignmentsMap.get(key)?.push(ds);
    });

    
    const schedule: any[] = [];
    
    dates.forEach(date => {
        shifts.forEach(shift => {
            const key = `${date}_${shift.id}`;
            const shiftsInSlot = assignmentsMap.get(key) || [];
            
            const doctors = shiftsInSlot.map((ds: any) => ({
                doctorShiftId: ds.id,
                doctorId: ds.doctor?.id,
                doctorCode: ds.doctor?.doctorCode || "",
                doctorName: ds.doctor?.user?.fullName || "Unknown",
                doctorEmail: ds.doctor?.user?.email || "",
                specialty: ds.doctor?.specialty?.name || "",
                specialtyId: ds.doctor?.specialty?.id,
            }));

            schedule.push({
                date: date,
                shift: {
                    id: shift.id,
                    name: shift.name,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                },
                doctors: doctors
            });
        });
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
