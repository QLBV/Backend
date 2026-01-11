import { Request, Response, NextFunction } from "express";
import { ShiftTemplateService } from "../services/shiftTemplate.service";

export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { doctorId, shiftId, dayOfWeek, notes } = req.body;

    const template = await ShiftTemplateService.createTemplate({
      doctorId,
      shiftId,
      dayOfWeek,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Shift template created successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { doctorId, shiftId, dayOfWeek, isActive } = req.query;

    const filters: any = {};
    if (doctorId && doctorId !== "all") filters.doctorId = Number(doctorId);
    if (shiftId && shiftId !== "all") filters.shiftId = Number(shiftId);
    if (dayOfWeek && dayOfWeek !== "all") filters.dayOfWeek = Number(dayOfWeek);
    if (isActive !== undefined && isActive !== "all") filters.isActive = isActive === "true";

    const templates = await ShiftTemplateService.getTemplates(filters);

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const template = await ShiftTemplateService.getTemplateById(Number(id));

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, isActive, notes } = req.body;

    const template = await ShiftTemplateService.updateTemplate(Number(id), {
      dayOfWeek,
      isActive,
      notes,
    });

    res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await ShiftTemplateService.deleteTemplate(Number(id));

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
