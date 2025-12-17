import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Role from "../models/Role";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, attributes: ["name"] }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const payload = {
      id: user.id,
      role: user.Role?.name || "patient",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    //  Response
    return res.json({
      success: true,
      message: "Login successful",
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.Role?.name,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

//   try {
//     const { email, password, fullName, roleId } = req.body;

//     if (!email || !password || !fullName) {
//       return res.status(400).json({
//         success: false,
//         message: "Email, password and fullName are required",
//       });
//     }

//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "Email already exists",
//       });
//     }

//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     const user = await User.create({
//       email,
//       password: hashedPassword,
//       fullName,
//       roleId: roleId || 4, // Default: Patient
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Registration successful",
//       user: {
//         id: user.id,
//         email: user.email,
//         fullName: user.fullName,
//       },
//     });
//   } catch (error) {
//     console.error("Register error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Registration failed",
//     });
//   }
// };
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password and fullName are required",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const patientRole = await Role.findOne({
      where: { name: "PATIENT" },
    });

    if (!patientRole) {
      return res.status(500).json({
        success: false,
        message: "Patient role not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      fullName,
      roleId: patientRole.id,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: "patient",
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error("JWT_REFRESH_SECRET is not defined");
    }

    const decoded = jwt.verify(refreshToken, secret) as {
      id: number;
      role: string;
    };

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};
