import express from "express";
import {
  getAllPermissions,
  getRolePermissions,
  assignPermissionsToRole,
  addPermissionToRole,
  removePermissionFromRole,
  createPermission,
  deletePermission,
  getModulesWithPermissions,
} from "./permission.controller";
import { verifyToken } from "../../middlewares/auth.middlewares";
import { requireRole } from "../../middlewares/roleCheck.middlewares";
import { RoleCode } from "../../constant/role";

const router = express.Router();




router.get("/", verifyToken, requireRole(RoleCode.ADMIN), getAllPermissions);


router.get("/modules", verifyToken, requireRole(RoleCode.ADMIN), getModulesWithPermissions);


router.get("/role/:roleId", verifyToken, requireRole(RoleCode.ADMIN), getRolePermissions);


router.post("/role/:roleId/assign", verifyToken, requireRole(RoleCode.ADMIN), assignPermissionsToRole);


router.post("/role/:roleId/add", verifyToken, requireRole(RoleCode.ADMIN), addPermissionToRole);


router.delete("/role/:roleId/remove/:permissionId", verifyToken, requireRole(RoleCode.ADMIN), removePermissionFromRole);


router.post("/", verifyToken, requireRole(RoleCode.ADMIN), createPermission);


router.delete("/:id", verifyToken, requireRole(RoleCode.ADMIN), deletePermission);

export default router;