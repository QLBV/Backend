import express from "express";
import {
  getSystemSettings,
  updateSystemSettings,
} from "../controllers/system.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = express.Router();


/**
 * @route   GET /api/system/settings
 * @desc    Lấy cài đặt hệ thống hiện tại
 * @access  Admin only
 */
router.get(
  "/settings",
  verifyToken,
  requireRole(RoleCode.ADMIN),
  getSystemSettings
);

/**
 * @route   PUT /api/system/settings
 * @desc    Cập nhật cài đặt hệ thống
 * @access  Admin only
 */
router.put(
  "/settings",
  verifyToken,
  requireRole(RoleCode.ADMIN),
  updateSystemSettings
);

export default router;

