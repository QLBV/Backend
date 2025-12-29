import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";

import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = Router();

router.use(verifyToken);

// ============ ADMIN ONLY ============

router.get("/", requireRole(RoleCode.ADMIN), getAllUsers);

router.get("/:id", requireRole(RoleCode.ADMIN), getUserById);

router.post("/", requireRole(RoleCode.ADMIN), createUser);

router.put("/:id", requireRole(RoleCode.ADMIN), updateUser);

router.delete("/:id", requireRole(RoleCode.ADMIN), deleteUser);

export default router;
