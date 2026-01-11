import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User, Role, Employee, Patient, Specialty } from "../models";
import { Op } from "sequelize";
import { RoleCode } from "../constant/role";
import {
  getNotificationSettingsService,
  updateNotificationSettingsService,
} from "../services/notificationSettings.service";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, role, isActive } = req.query;
    console.log("getAllUsers params:", { page, limit, search, role, isActive });
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role && role !== "all") {
      if (role === "employee") {
        where["$role.name$"] = { [Op.in]: ["DOCTOR", "RECEPTIONIST"] };
      } else {
        where["$role.name$"] = role.toString().toUpperCase();
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    console.log("getAllUsers where:", JSON.stringify(where));

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role", attributes: ["name"] }],
      limit: limitNum,
      offset: offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return res.json({
      success: true,
      data: {
        users,
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Get all users error detail:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get users",
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, as: "role", attributes: ["name"] },
        { 
          model: Employee, 
          as: "employee", 
          include: [{ model: Specialty, as: "specialty", attributes: ["name"] }] 
        },
        { model: Patient, as: "patient" }
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, roleId, phone, gender, dateOfBirth, address, cccd } = req.body;

    if (!email || !password || !fullName || !roleId) {
      return res.status(400).json({
        success: false,
        message: "Email, password, fullName and roleId are required",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      roleId,
    });

    // Create profile based on role
    const rid = Number(roleId);
    const idStr = user.id.toString().padStart(4, '0');

    if (rid === RoleCode.DOCTOR || rid === RoleCode.RECEPTIONIST || rid === RoleCode.ADMIN) {
      const prefixes: Record<number, string> = {
        [RoleCode.DOCTOR]: 'DOC',
        [RoleCode.RECEPTIONIST]: 'REC',
        [RoleCode.ADMIN]: 'ADM'
      };
      const prefix = prefixes[rid] || 'EMP';
      const employeeCode = `${prefix}${idStr}`;
      
      const pos = rid === RoleCode.DOCTOR ? 'Bác sĩ' : (rid === RoleCode.RECEPTIONIST ? 'Lễ tân' : 'Quản trị viên');
      
      await Employee.create({
        userId: user.id,
        employeeCode,
        position: pos,
        joiningDate: new Date().toISOString().split('T')[0],
        phone,
        gender,
        dateOfBirth,
        address,
        cccd
      });

      // If it's a doctor, also create record in doctors table for compatibility
      if (rid === RoleCode.DOCTOR) {
        const Doctor = require("../models/Doctor").default;
        await Doctor.create({
          userId: user.id,
          doctorCode: employeeCode,
          position: pos,
          description: ""
        });
      }
    } else if (rid === RoleCode.PATIENT) {
      const patientCode = `PAT${idStr}`;
      await Patient.create({
        userId: user.id,
        patientCode,
        fullName: user.fullName,
        gender: gender || 'OTHER',
        dateOfBirth: dateOfBirth || new Date(),
        phone,
        address
      } as any);
    }

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, fullName, roleId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    await user.update({
      email: email || user.email,
      fullName: fullName || user.fullName,
      roleId: roleId || user.roleId,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });

    return res.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update({ isActive: false });

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatar: avatarPath });

    return res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatar: avatarPath,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
    });
  }
};

/**
 * Activate user account
 * PUT /api/users/:id/activate
 * Role: ADMIN
 */
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: "User is already active",
      });
    }

    await user.update({ isActive: true });

    // Reload to get latest state from database
    await user.reload();
    console.log("User activated, isActive after reload:", user.isActive);

    return res.json({
      success: true,
      message: "User activated successfully",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Activate user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to activate user",
    });
  }
};

/**
 * Deactivate user account
 * PUT /api/users/:id/deactivate
 * Role: ADMIN
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "User is already inactive",
      });
    }

    await user.update({ isActive: false });

    // Reload to get latest state from database
    await user.reload();
    console.log("User deactivated, isActive after reload:", user.isActive);

    return res.json({
      success: true,
      message: "User deactivated successfully",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
    });
  }
};

/**
 * Change user role
 * PUT /api/users/:id/role
 * Role: ADMIN
 */
export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: "roleId is required",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    if (user.roleId === roleId) {
      return res.status(400).json({
        success: false,
        message: "User already has this role",
      });
    }

    await user.update({ roleId });

    // Ensure profile mapping exists for the new role
    const rid = Number(roleId);
    const idStr = user.id.toString().padStart(4, '0');

    if ([RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR].includes(rid)) {
      let employee = await Employee.findOne({ where: { userId: user.id } });
      if (!employee) {
        const prefixes: Record<number, string> = {
          [RoleCode.DOCTOR]: 'DOC',
          [RoleCode.RECEPTIONIST]: 'REC',
          [RoleCode.ADMIN]: 'ADM'
        };
        const prefix = prefixes[rid] || 'EMP';
        const employeeCode = `${prefix}${idStr}`;
        const pos = rid === RoleCode.DOCTOR ? 'Bác sĩ' : (rid === RoleCode.RECEPTIONIST ? 'Lễ tân' : 'Quản trị viên');
        
        employee = await Employee.create({
          userId: user.id,
          employeeCode,
          position: pos,
          joiningDate: new Date().toISOString().split('T')[0]
        });
      }

      if (rid === RoleCode.DOCTOR) {
        const Doctor = (await import("../models/Doctor")).default;
        const exists = await Doctor.findOne({ where: { userId: user.id } });
        if (!exists) {
          await Doctor.create({
            userId: user.id,
            doctorCode: employee.employeeCode,
            specialtyId: employee.specialtyId,
            position: employee.position,
            degree: employee.degree
          });
        }
      }
    } else if (rid === RoleCode.PATIENT) {
      const exists = await Patient.findOne({ where: { userId: user.id } });
      if (!exists) {
        await Patient.create({
          userId: user.id,
          patientCode: `PAT${idStr}`,
          fullName: user.fullName,
          gender: 'OTHER',
          dateOfBirth: new Date()
        });
      }
    }

    // Reload with role information
    await user.reload({
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    const userData: any = user.toJSON();
    if (userData.role) {
      userData.role = userData.role;
    }

    return res.json({
      success: true,
      message: "User role changed successfully",
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
        role: user.get("role"),
      },
    });
  } catch (error) {
    console.error("Change user role error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change user role",
    });
  }
};

/**
 * Get my notification settings
 * GET /api/users/me/notification-settings
 */
export const getMyNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const settings = await getNotificationSettingsService(userId);

    return res.json({
      success: true,
      message: "Notification settings retrieved successfully",
      data: settings,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve notification settings",
    });
  }
};

/**
 * Update my notification settings
 * PUT /api/users/me/notification-settings
 */
export const updateMyNotificationSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    const { emailEnabled, smsEnabled, pushEnabled, inAppEnabled } = req.body || {};

    const parseBoolean = (value: any) => {
      if (value === undefined) return undefined;
      if (typeof value === "boolean") return value;
      if (value === "true") return true;
      if (value === "false") return false;
      return null;
    };

    const updates: any = {};

    const parsedEmail = parseBoolean(emailEnabled);
    if (parsedEmail === null) {
      return res.status(400).json({
        success: false,
        message: "emailEnabled must be a boolean",
      });
    }
    if (parsedEmail !== undefined) updates.emailEnabled = parsedEmail;

    const parsedSms = parseBoolean(smsEnabled);
    if (parsedSms === null) {
      return res.status(400).json({
        success: false,
        message: "smsEnabled must be a boolean",
      });
    }
    if (parsedSms !== undefined) updates.smsEnabled = parsedSms;

    const parsedPush = parseBoolean(pushEnabled);
    if (parsedPush === null) {
      return res.status(400).json({
        success: false,
        message: "pushEnabled must be a boolean",
      });
    }
    if (parsedPush !== undefined) updates.pushEnabled = parsedPush;

    const parsedInApp = parseBoolean(inAppEnabled);
    if (parsedInApp === null) {
      return res.status(400).json({
        success: false,
        message: "inAppEnabled must be a boolean",
      });
    }
    if (parsedInApp !== undefined) updates.inAppEnabled = parsedInApp;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid settings provided",
      });
    }

    const settings = await updateNotificationSettingsService(userId, updates);

    return res.json({
      success: true,
      message: "Notification settings updated successfully",
      data: settings,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to update notification settings",
    });
  }
};
