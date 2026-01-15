import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from "./auth.controller";
import {
  sendOTP,
  verifyOTP,
  resendOTP,
} from "./otp.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../../middlewares/validators/auth.validators";

const router = Router();


router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);


router.post("/refresh-token", refreshToken);


router.post("/logout", verifyToken, logout);


router.post("/forgot-password", forgotPasswordValidator, forgotPassword);


router.post("/reset-password", resetPasswordValidator, resetPassword);


router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

export default router;
