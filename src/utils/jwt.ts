import * as jwt from "jsonwebtoken";
import { RoleCode } from "../constant/role";

export interface JwtPayload {
  userId: number;
  roleId: RoleCode;
  patientId?: number | null;
  doctorId?: number | null;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: JwtPayload, expiresIn: string = "7d"): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET not defined");
  }

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
};
