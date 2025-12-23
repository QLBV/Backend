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

/* ================= REGISTER ================= */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, roleId = RoleCode.PATIENT } = req.body;

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
      fullName: "",
    });

    return res.status(201).json({
      success: true,
      message: "REGISTER_SUCCESS",
      user: {
        id: user.id,
        email: user.email,
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
    userId: user.id,
    roleId: user.roleId,
    patientId,
    doctorId,
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
