import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../middlewares/validators/auth.validators";

const router = Router();

// Đăng ký và đăng nhập
router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);

// Làm mới token
router.post("/refresh-token", refreshToken);

// Đăng xuất
router.post("/logout", verifyToken, logout);

// Quên mật khẩu
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);

// Reset mật khẩu
router.post("/reset-password", resetPasswordValidator, resetPassword);

export default router;
