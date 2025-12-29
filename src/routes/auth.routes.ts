import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
} from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import {
  registerValidator,
  loginValidator,
} from "../middlewares/validators/auth.validators";

const router = Router();

// Đăng ký và đăng nhập
router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
// Làm mới token
router.post("/refresh-token", verifyToken, refreshToken);
// Đăng xuất
router.post("/logout", verifyToken, logout);

export default router;
