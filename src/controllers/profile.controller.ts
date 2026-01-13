import { Request, Response } from "express";
import User from "../models/User";
import Role from "../models/Role";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import bcrypt from "bcrypt";

/**
 * Get current user profile
 * GET /api/profile
 */
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get additional info based on role
    let additionalInfo: any = null;
    let patientId: number | null = null;
    let doctorId: number | null = null;
    let employeeId: number | null = null;

    if (user.roleId === 3) {
      // PATIENT
      additionalInfo = await Patient.findOne({
        where: { userId },
        attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [
          {
            model: require("../models/PatientProfile").default,
            as: "profiles",
          },
        ],
      });
      if (additionalInfo) {
        patientId = additionalInfo.id;
      }
    } else if ([1, 2, 4].includes(user.roleId)) {
      // ADMIN, RECEPTIONIST, DOCTOR
      const Employee = require("../models/Employee").default;
      additionalInfo = await Employee.findOne({
        where: { userId },
        attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [
          {
            model: require("../models/Specialty").default,
            as: "specialty",
            attributes: ["id", "name"],
          },
        ],
      });
      if (additionalInfo) {
        employeeId = additionalInfo.id;
        if (user.roleId === 4) {
          // Get actual doctorId from Doctor table
          const doc = await Doctor.findOne({ where: { userId } });
          doctorId = doc ? doc.id : additionalInfo.id; 
        }
      }
    }

    const profileData: any = {
      ...user.toJSON(),
      patientId,
      doctorId,
      employeeId,
      patient: user.roleId === 3 ? additionalInfo : null,
      doctor: [1, 2, 4].includes(user.roleId) ? additionalInfo : null,
      profileDetails: additionalInfo,
    };

    if (profileData.doctor && profileData.doctor.employeeCode && !profileData.doctor.doctorCode) {
      profileData.doctor.doctorCode = profileData.doctor.employeeCode;
    }

    return res.json({
      success: true,
      data: profileData,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get profile",
    });
  }
};

/**
 * Update current user profile
 * PUT /api/profile
 */
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      fullName,
      avatar,
      email,
      phone,
      address,
      gender,
      dateOfBirth,
      cccd,
      bio,
      position,
      degree,
      expertise,
      profiles,
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 1. Update basic User info
    if (fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;
    if (email) user.email = email;
    await user.save();

    // 2. Update Role-specific info
    if (user.roleId === 3) {
      // PATIENT
      const Patient = require("../models/Patient").default;
      const patient = await Patient.findOne({ where: { userId } });
      if (patient) {
        if (fullName) patient.fullName = fullName;
        if (gender) patient.gender = gender;
        if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
        if (cccd) patient.cccd = cccd;
        if (avatar) patient.avatar = avatar;
        await patient.save();

        // Update Patient Profiles (Phone, Address)
        const PatientProfile = require("../models/PatientProfile").default;
        if (profiles && Array.isArray(profiles)) {
          for (const p of profiles) {
            await PatientProfile.upsert({
              patientId: patient.id,
              type: p.type,
              value: p.value,
              city: p.city,
              ward: p.ward,
              isPrimary: true,
            });
          }
        } else {
          // Fallback to top-level phone/address if profiles not provided
          if (phone) {
            await PatientProfile.upsert({
              patientId: patient.id,
              type: "phone",
              value: phone,
              isPrimary: true,
            });
          }
          if (address) {
            await PatientProfile.upsert({
              patientId: patient.id,
              type: "address",
              value: address,
              isPrimary: true,
            });
          }
        }
      }
    } else if ([1, 2, 4].includes(user.roleId)) {
      // ADMIN, RECEPTIONIST, DOCTOR
      const Employee = require("../models/Employee").default;
      const employee = await Employee.findOne({ where: { userId } });
      if (employee) {
        if (phone) employee.phone = phone;
        if (address) employee.address = address;
        if (gender) employee.gender = gender;
        if (dateOfBirth) employee.dateOfBirth = dateOfBirth;
        if (cccd) employee.cccd = cccd;
        if (avatar) employee.avatar = avatar;
        if (bio) employee.description = bio;
        if (position) employee.position = position;
        if (degree) employee.degree = degree;
        if (expertise) employee.expertise = expertise;
        await employee.save();
      }
    }

    // Return full updated profile structure
    return getMyProfile(req, res);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to update profile",
    });
  }
};

/**
 * Change password
 * PUT /api/profile/password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has password (OAuth users might not have password)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Cannot change password for OAuth accounts",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_SALT_ROUNDS || "10")
    );
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to change password",
    });
  }
};

/**
 * Upload avatar
 * POST /api/profile/avatar
 */
export const uploadMyAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    // Sync to Patient or Employee model
    try {
      if (user.roleId === 3) {
        // Patient
        const Patient = require("../models/Patient").default;
        await Patient.update({ avatar: avatarUrl }, { where: { userId } });
      } else if ([1, 2, 4].includes(user.roleId)) {
        // Admin, Doctor, Receptionist
        const Employee = require("../models/Employee").default;
        await Employee.update({ avatar: avatarUrl }, { where: { userId } });
      }
    } catch (syncError) {
      console.error("Failed to sync avatar to specific profile:", syncError);
      // Don't fail the request if sync fails, main user avatar is updated
    }

    return res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatar: avatarUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to upload avatar",
    });
  }
};
