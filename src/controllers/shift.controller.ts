import { Request, Response } from "express";
import Shift from "../models/Shifts";

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
