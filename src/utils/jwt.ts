import * as jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    payload,
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? "1d" } as jwt.SignOptions
  );
};
