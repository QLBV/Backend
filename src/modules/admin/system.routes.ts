import express from "express";
import {
  getSystemSettings,
  updateSystemSettings,
} from "./system.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";

const router = express.Router();



router.get(
  "/settings",
  verifyToken,
  requireRole(RoleCode.ADMIN),
  getSystemSettings
);


router.put(
  "/settings",
  verifyToken,
  requireRole(RoleCode.ADMIN),
  updateSystemSettings
);

export default router;

