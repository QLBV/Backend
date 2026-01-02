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
    const userId = (req as any).user.id;

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

    if ((req as any).user.roleId === 3) {
      // PATIENT
      additionalInfo = await Patient.findOne({
        where: { userId },
        attributes: { exclude: ["createdAt", "updatedAt"] },
      });
    } else if ((req as any).user.roleId === 4) {
      // DOCTOR
      additionalInfo = await Doctor.findOne({
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
    }

    return res.json({
      success: true,
      data: {
        ...user.toJSON(),
        profileDetails: additionalInfo,
      },
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
    const userId = (req as any).user.id;
    const { fullName, avatar } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    if (fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role" }],
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
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
    const userId = (req as any).user.id;
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
    const userId = (req as any).user.id;

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
    const avatarUrl = `/uploads/users/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

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
