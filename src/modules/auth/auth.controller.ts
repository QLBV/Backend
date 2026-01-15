import { Request, Response } from "express";
import User from "../../models/User";
import Patient from "../../models/Patient";
import Doctor from "../../models/Doctor";
import { RoleCode } from "../../constant/role";
import { comparePassword, hashPassword } from "../../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from "../../utils/jwt";
import jwt from "jsonwebtoken";
import { TokenBlacklistService } from "../../config/redis.config";


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


export const login = async (req: Request, res: Response) => {
  const { email, password, remember } = req.body;

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

  
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "ACCOUNT_DEACTIVATED",
    });
  }

  
  
  if (user.roleId === RoleCode.PATIENT && !user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "EMAIL_NOT_VERIFIED",
      data: {
        email: user.email,
        requireVerification: true,
      },
    });
  }

  let patientId: number | null = null;
  let doctorId: number | null = null;

  if (user.roleId === RoleCode.PATIENT) {
    const patient = await Patient.findOne({ where: { userId: user.id } });
    patientId = patient ? patient.id : null;
  }

  
  if ([RoleCode.DOCTOR, RoleCode.RECEPTIONIST, RoleCode.ADMIN].includes(user.roleId)) {
    const Employee = require( "../../models/Employee").default;
    const employee = await Employee.findOne({ where: { userId: user.id } });
    
    if (employee) {
      if (user.roleId === RoleCode.DOCTOR) {
        let doctor = await Doctor.findOne({ where: { userId: user.id } });
        if (!doctor) {
          
          doctor = await Doctor.create({
            userId: user.id,
            doctorCode: employee.employeeCode,
            specialtyId: employee.specialtyId,
            position: employee.position,
            degree: employee.degree,
            description: employee.description
          });
          console.log(`[Auth] Auto-reconciled missing doctor record for user ${user.id}`);
        }
        doctorId = doctor.id;
      } else {
        
        doctorId = employee.id;
      }
    }
  }

  
  const jwtPayload = {
    userId: user.id,
    roleId: user.roleId,
    patientId,
    doctorId,
  };

  
  const userData = {
    email: user.email,
    fullName: user.fullName,
    userId: user.id,
    roleId: user.roleId,
    patientId,
    doctorId,
  };

  
  const expiresIn = remember ? "30d" : "1d";

  return res.json({
    success: true,
    message: "LOGIN_SUCCESS",
    tokens: {
      accessToken: generateAccessToken(jwtPayload),
      refreshToken: generateRefreshToken(jwtPayload, expiresIn),
    },
    user: userData,
  });
};


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


export const logout = async (req: Request, res: Response) => {
  try {
    
    const token = (req as any).token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "NO_TOKEN_PROVIDED",
      });
    }

    
    const decoded = jwt.decode(token) as { exp: number };
    if (!decoded || !decoded.exp) {
      return res.status(400).json({
        success: false,
        message: "INVALID_TOKEN",
      });
    }

    
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl > 0) {
      
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
import { sendEmail } from "../../services/email.service"; 

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
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); 
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  console.log(` Sending password reset email to: ${user.email}`);
  console.log(` Reset link: ${resetLink}`);

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset mật khẩu - Hệ thống Phòng khám",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
          <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Hoặc copy link sau vào trình duyệt:<br>
            <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            <strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong <strong>15 phút</strong>.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
        </div>
      `,
    });
    console.log(` Password reset email sent successfully to: ${user.email}`);
  } catch (error) {
    console.error(` Failed to send password reset email to ${user.email}:`, error);
    
  }

  return res.json({
    message: "Nếu email tồn tại, link reset đã được gửi",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token và mật khẩu mới là bắt buộc",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    console.log(` Attempting password reset with token: ${token.substring(0, 10)}...`);

    
    const { Op } = require("sequelize");

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: new Date() }, 
      },
    });

    if (!user) {
      console.log(` No user found with valid reset token`);
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    console.log(` Valid token found for user: ${user.email}`);

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    console.log(` Password reset successfully for user: ${user.email}`);

    return res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error(" Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đặt lại mật khẩu",
    });
  }
};
