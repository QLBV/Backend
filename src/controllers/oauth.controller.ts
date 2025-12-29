import { Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * OAuth Callback Success Handler
 * Called after successful OAuth authentication
 * Generates JWT token and returns to client
 */
export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: "OAuth authentication failed",
      });
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
    );

    // In production, you would redirect to frontend with token
    // For now, return JSON response
    return res.json({
      success: true,
      message: "OAuth login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roleId: user.roleId,
          oauth2Provider: user.oauth2Provider,
        },
      },
    });

    // Production redirect example:
    // const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    // return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "OAuth callback failed",
    });
  }
};

/**
 * OAuth Failure Handler
 * Called when OAuth authentication fails
 */
export const oauthFailure = (req: Request, res: Response) => {
  return res.status(401).json({
    success: false,
    message: "OAuth authentication failed",
  });
};