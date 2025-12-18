import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} from "../controllers/userController";
import { verifyToken } from "../middlewares/auth";
import { requireRole } from "../middlewares/roleCheck";
import { uploadUserAvatar as uploadAvatarMiddleware } from "../middlewares/uploadUserAvatar";
import { uploadAvatar } from "../controllers/userController";

const router = Router();

router.use(verifyToken);

// GET /api/users
router.get("/", requireRole("ADMIN"), getAllUsers);

// GET /api/users/:id
router.get("/:id", getUserById);

// POST /api/users
router.post("/", requireRole("ADMIN"), createUser);

// PUT /api/users/:id
router.put("/:id", requireRole("ADMIN"), updateUser);

// DELETE /api/users/:id
router.delete("/:id", requireRole("ADMIN"), deleteUser);

// PUT /api/users/:id/change-password
router.put("/:id/change-password", changePassword);

router.post(
  "/:id/avatar",
  uploadAvatarMiddleware.single("avatar"),
  uploadAvatar
);

export default router;
