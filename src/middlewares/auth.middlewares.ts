// import { Request, Response, NextFunction } from "express";
// import { verifyAccessToken, JwtPayload } from "../utils/jwt";

// export interface AuthRequest extends Request {
//   user?: JwtPayload;
// }

// export const verifyToken = (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({
//       success: false,
//       message: "UNAUTHORIZED",
//     });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = verifyAccessToken(token);
//     req.user = decoded;
//     next();
//   } catch {
//     return res.status(401).json({
//       success: false,
//       message: "INVALID_TOKEN",
//     });
//   }
// };
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtUserPayload } from "../types/auth";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "NO_TOKEN",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtUserPayload;

    req.user = decoded; // ✅ Typed
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "INVALID_TOKEN",
    });
  }
};
