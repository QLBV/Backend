import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  uploadMyAvatar,
} from "./profile.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import {
  validateUpdateProfile,
  validateChangePassword,
} from "../../middlewares/validators/profile.validators";
import { uploadUserAvatar } from "../../middlewares/uploadUserAvatar.middlewares";

const router = Router();


router.use(verifyToken);


router.get("/", getMyProfile);


router.put("/", validateUpdateProfile, updateMyProfile);


router.put("/password", validateChangePassword, changePassword);


router.post(
  "/avatar",
  uploadUserAvatar.single("avatar"),
  uploadMyAvatar
);

export default router;
