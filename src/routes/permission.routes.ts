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
} from "../controllers/permission.controller";
import { verifyToken } from "../middlewares/auth.middlewares";
import { requireRole } from "../middlewares/roleCheck.middlewares";
import { RoleCode } from "../constant/role";

const router = express.Router();

/**
 * All permission management routes require ADMIN role
 */

// GET /api/permissions - Get all permissions
router.get("/", verifyToken, requireRole(RoleCode.ADMIN), getAllPermissions);

// GET /api/permissions/modules - Get modules with permissions (for UI)
router.get("/modules", verifyToken, requireRole(RoleCode.ADMIN), getModulesWithPermissions);

// GET /api/permissions/role/:roleId - Get permissions for a specific role
router.get("/role/:roleId", verifyToken, requireRole(RoleCode.ADMIN), getRolePermissions);

// POST /api/permissions/role/:roleId/assign - Assign multiple permissions to role
router.post("/role/:roleId/assign", verifyToken, requireRole(RoleCode.ADMIN), assignPermissionsToRole);

// POST /api/permissions/role/:roleId/add - Add single permission to role
router.post("/role/:roleId/add", verifyToken, requireRole(RoleCode.ADMIN), addPermissionToRole);

// DELETE /api/permissions/role/:roleId/remove/:permissionId - Remove permission from role
router.delete("/role/:roleId/remove/:permissionId", verifyToken, requireRole(RoleCode.ADMIN), removePermissionFromRole);

// POST /api/permissions - Create new permission
router.post("/", verifyToken, requireRole(RoleCode.ADMIN), createPermission);

// DELETE /api/permissions/:id - Delete permission
router.delete("/:id", verifyToken, requireRole(RoleCode.ADMIN), deletePermission);

export default router;