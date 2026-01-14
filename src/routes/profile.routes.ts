import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  uploadMyAvatar,
} from "../controllers/profile.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import {
  validateUpdateProfile,
  validateChangePassword,
} from "../middlewares/validators/profile.validators";
import { uploadUserAvatar } from "../middlewares/uploadUserAvatar.middlewares";

const router = Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  Private (All authenticated users)
 */
router.get("/", getMyProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update current user profile
 * @access  Private (All authenticated users)
 */
router.put("/", validateUpdateProfile, updateMyProfile);

/**
 * @route   PUT /api/profile/password
 * @desc    Change password
 * @access  Private (All authenticated users)
 */
router.put("/password", validateChangePassword, changePassword);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload avatar
 * @access  Private (All authenticated users)
 */
router.post(
  "/avatar",
  uploadUserAvatar.single("avatar"),
  uploadMyAvatar
);

export default router;
