import { Request, Response } from "express";
import {
  calculateDoctorSalary,
  getDoctorSalaries,
  getSalaryById,
  updateSalaryStatus,
} from "../services/salary.service";
import { SalaryStatus } from "../models/Salary";

export const calculateSalary = async (req: Request, res: Response) => {
  try {
    const { doctorId, month, year, bonus = 0, penalty = 0, note } = req.body;
    const salary = await calculateDoctorSalary(
      Number(doctorId),
      Number(month),
      Number(year),
      Number(bonus),
      Number(penalty),
      note
    );
    res.json({ success: true, data: salary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSalariesByDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const salaries = await getDoctorSalaries(Number(doctorId));
    res.json({ success: true, data: salaries });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSalaryDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salary = await getSalaryById(Number(id));
    if (!salary)
      return res
        .status(404)
        .json({ success: false, message: "Salary not found" });
    res.json({ success: true, data: salary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSalary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!Object.values(SalaryStatus).includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }
    const salary = await updateSalaryStatus(Number(id), status);
    res.json({ success: true, data: salary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
