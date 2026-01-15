import { Request, Response, NextFunction } from "express";
import { ScheduleGenerationService } from "./scheduleGeneration.service";


export const generateMonthlySchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ScheduleGenerationService.generateMonthlySchedule();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


export const generateScheduleForMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required",
      });
    }

    const result = await ScheduleGenerationService.generateScheduleForMonth(
      Number(year),
      Number(month)
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


export const previewMonthlySchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ScheduleGenerationService.previewMonthlySchedule();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
