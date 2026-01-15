import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  changeUserRole,
  getMyNotificationSettings,
  updateMyNotificationSettings,
} from "../controllers/user.controller";

import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";
import {
  validateNumericId,
  validatePagination,
} from "../middlewares/validators/common.validators";

const router = Router();

router.use(verifyToken);

router.get("/me/notification-settings", getMyNotificationSettings);
router.put("/me/notification-settings", updateMyNotificationSettings);

router.get("/", requireRole(RoleCode.ADMIN), validatePagination, getAllUsers);

router.get(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  getUserById
);

router.post("/", requireRole(RoleCode.ADMIN), createUser);

router.put(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  updateUser
);

router.put(
  "/:id/activate",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  activateUser
);

router.put(
  "/:id/deactivate",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  deactivateUser
);

router.put(
  "/:id/role",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  changeUserRole
);

router.delete(
  "/:id",
  validateNumericId("id"),
  requireRole(RoleCode.ADMIN),
  deleteUser
);

export default router;
