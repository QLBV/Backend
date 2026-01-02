import { Request, Response } from "express";
import User from "../models/User";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import { RoleCode } from "../constant/role";
import { comparePassword, hashPassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from "../utils/jwt";
import jwt from "jsonwebtoken";
import { TokenBlacklistService } from "../config/redis.config";

/* ================= REGISTER ================= */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, roleId = RoleCode.PATIENT } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "EMAIL_AND_PASSWORD_REQUIRED",
      });
    }

    const existed = await User.findOne({ where: { email } });
    if (existed) {
      return res.status(400).json({
        success: false,
        message: "EMAIL_ALREADY_EXISTS",
      });
    }

    const user = await User.create({
      email,
      password: await hashPassword(password),
      roleId,
      fullName: fullName || "",
    });

    return res.status(201).json({
      success: true,
      message: "REGISTER_SUCCESS",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "REGISTER_FAILED",
    });
  }
};

/* ================= LOGIN  ================= */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "INVALID_CREDENTIALS",
    });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({
      success: false,
      message: "INVALID_CREDENTIALS",
    });
  }

  let patientId: number | null = null;
  let doctorId: number | null = null;

  if (user.roleId === RoleCode.PATIENT) {
    const patient = await Patient.findOne({ where: { userId: user.id } });
    patientId = patient ? patient.id : null;
  }

  if (user.roleId === RoleCode.DOCTOR) {
    const doctor = await Doctor.findOne({ where: { userId: user.id } });
    doctorId = doctor ? doctor.id : null;
  }

  const payload = {
    email: user.email,
    fullName: user.fullName,
    userId: user.id,
    roleId: user.roleId,
    // patientId,
    // doctorId,
  };

  return res.json({
    success: true,
    message: "LOGIN_SUCCESS",
    tokens: {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    },
    user: payload,
  });
};

/* ================= REFRESH TOKEN ================= */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "REFRESH_TOKEN_REQUIRED",
      });
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error("JWT_REFRESH_SECRET_NOT_DEFINED");
    }

    const decoded = jwt.verify(refreshToken, secret) as {
      userId: number;
      roleId: RoleCode;
      patientId?: number | null;
      doctorId?: number | null;
    };

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      roleId: decoded.roleId,
      patientId: decoded.patientId ?? null,
      doctorId: decoded.doctorId ?? null,
    });

    return res.json({
      success: true,
      message: "REFRESH_SUCCESS",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(401).json({
      success: false,
      message: "INVALID_REFRESH_TOKEN",
    });
  }
};

/* ================= LOGOUT ================= */
export const logout = async (req: Request, res: Response) => {
  try {
    // Get token from request (stored by verifyToken middleware)
    const token = (req as any).token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "NO_TOKEN_PROVIDED",
      });
    }

    // Decode to get expiration time
    const decoded = jwt.decode(token) as { exp: number };
    if (!decoded || !decoded.exp) {
      return res.status(400).json({
        success: false,
        message: "INVALID_TOKEN",
      });
    }

    // Calculate remaining TTL in seconds
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl > 0) {
      // Add to blacklist with TTL
      await TokenBlacklistService.addToBlacklist(token, ttl);
    }

    return res.json({
      success: true,
      message: "LOGOUT_SUCCESS",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "LOGOUT_FAILED",
    });
  }
};
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email"; // đã tồn tại trong project

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json({
      message: "Nếu email tồn tại, link reset đã được gửi",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
  await user.save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset mật khẩu",
    html: `
      <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
      <p>Link chỉ có hiệu lực trong 15 phút:</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  });

  return res.json({
    message: "Nếu email tồn tại, link reset đã được gửi",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;

  await user.save();

  return res.json({
    message: "Đặt lại mật khẩu thành công",
  });
};
