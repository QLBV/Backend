import { Request, Response } from "express";
import Doctor from "../models/Doctor";
import User from "../models/User";
import Specialty from "../models/Specialty";
import { createDoctor } from "../services/doctor.service";

export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "avatar"],
        },
        { model: Specialty, as: "specialty", attributes: ["id", "name"] },
      ],
    });
    return res.json({ success: true, data: doctors });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Get doctors failed", error });
  }
};

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "avatar"],
        },
        { model: Specialty, as: "specialty", attributes: ["id", "name"] },
      ],
    });
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    return res.json({ success: true, data: doctor });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Get doctor failed", error });
  }
};

export const createDoctorController = async (req: Request, res: Response) => {
  try {
    const { userId, specialtyId, position, degree, description } = req.body;
    const user = await User.findByPk(userId);
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    if (!user.roleId)
      return res
        .status(400)
        .json({ success: false, message: "User has no role" });
    const doctor = await createDoctor({
      userId,
      specialtyId,
      position,
      degree,
      description,
    });
    return res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Create doctor failed", error });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { specialtyId, position, degree, description } = req.body;
    const doctor = await Doctor.findByPk(id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    await doctor.update({ specialtyId, position, degree, description });
    return res.json({ success: true, data: doctor });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Update doctor failed", error });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByPk(id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    await doctor.destroy();
    return res.json({ success: true, message: "Doctor deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Delete doctor failed", error });
  }
};

export const getAllSpecialties = async (req: Request, res: Response) => {
  try {
    const specialties = await Specialty.findAll();
    return res.json({ success: true, data: specialties });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Get specialties failed", error });
  }
};

/**
 * Get doctors by specialty ID
 * GET /api/specialties/:id/doctors
 * Role: PUBLIC
 */
export const getDoctorsBySpecialty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if specialty exists
    const specialty = await Specialty.findByPk(id);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: "Specialty not found",
      });
    }

    // Get all doctors with this specialty
    const doctors = await Doctor.findAll({
      where: { specialtyId: Number(id) },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phoneNumber", "avatar"],
        },
        {
          model: Specialty,
          as: "specialty",
          attributes: ["id", "name"],
        },
      ],
    });

    return res.json({
      success: true,
      message: "Doctors retrieved successfully",
      data: {
        specialty: {
          id: specialty.id,
          name: specialty.name,
        },
        doctors,
        count: doctors.length,
      },
    });
  } catch (error) {
    console.error("Get doctors by specialty error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get doctors by specialty",
    });
  }
};
