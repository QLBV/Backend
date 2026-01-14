import { Request, Response } from "express";
import Employee from "../models/Employee";
import User from "../models/User";
import Role from "../models/Role";
import Specialty from "../models/Specialty";
import { Op } from "sequelize";

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const { search, roleId, specialtyId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const where: any = {};
    const userWhere: any = {
      roleId: { [Op.in]: [1, 2, 4] } // Admin, Receptionist, Doctor
    };

    if (search) {
      where[Op.or] = [
        { employeeCode: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { '$user.fullName$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } }
      ];
    }

    if (roleId) {
      userWhere.roleId = roleId;
    }

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          where: userWhere,
          attributes: { exclude: ["password"] },
          include: [{ model: Role, as: "role", attributes: ["name"] }]
        },
        {
          model: Specialty,
          as: "specialty",
          attributes: ["name"]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset
    });

    return res.json({
      success: true,
      data: employees,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error: any) {
    console.error("Get all employees error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get employees"
    });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
          include: [{ model: Role, as: "role", attributes: ["name"] }]
        },
        {
          model: Specialty,
          as: "specialty",
          attributes: ["name"]
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    return res.json({
      success: true,
      data: employee
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get employee"
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      position, degree, specialtyId, description, joiningDate, isActive,
      phone, gender, dateOfBirth, address, cccd, avatar, expertise 
    } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // If isActive is provided, update the User record using instance method to trigger hooks
    if (isActive !== undefined) {
      const user = await User.findByPk(employee.userId);
      if (user) {
        await user.update({ isActive });
        console.log(`Employee ${id}: User ${user.id} isActive updated to ${isActive}`);
      }
    }

    await employee.update({
      position,
      degree,
      specialtyId,
      description,
      joiningDate,
      phone,
      gender,
      dateOfBirth,
      address,
      cccd,
      avatar,
      expertise,
      isActive
    });

    // Re-fetch with associations
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
          include: [{ model: Role, as: "role", attributes: ["name"] }]
        },
        {
          model: Specialty,
          as: "specialty",
          attributes: ["id", "name"]
        }
      ]
    });

    return res.json({
      success: true,
      data: updatedEmployee,
      message: "Employee updated successfully"
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update employee"
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    await employee.destroy();
    return res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete employee"
    });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const avatarUrl = `/uploads/employees/${req.file.filename}`;
    await employee.update({ avatar: avatarUrl });

    return res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { avatar: avatarUrl }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload avatar"
    });
  }
};
