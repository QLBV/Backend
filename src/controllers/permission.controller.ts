import { Request, Response } from "express";
import Permission from "../models/Permission";
import Role from "../models/Role";
import RolePermission from "../models/RolePermission";

/**
 * Get all permissions
 * GET /api/permissions
 * Role: ADMIN
 */
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.findAll({
      order: [["module", "ASC"], ["name", "ASC"]],
    });

    // Group by module
    const grouped = permissions.reduce((acc: any, permission: any) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push({
        id: permission.id,
        name: permission.name,
        description: permission.description,
      });
      return acc;
    }, {});

    return res.json({
      success: true,
      message: "Permissions retrieved successfully",
      data: {
        all: permissions,
        grouped,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get permissions",
    });
  }
};

/**
 * Get role permissions
 * GET /api/permissions/role/:roleId
 * Role: ADMIN
 */
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.json({
      success: true,
      message: "Role permissions retrieved successfully",
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
        },
        permissions: (role as any).permissions || [],
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get role permissions",
    });
  }
};

/**
 * Assign permissions to role
 * POST /api/permissions/role/:roleId/assign
 * Body: { permissionIds: [1, 2, 3] }
 * Role: ADMIN
 */
export const assignPermissionsToRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: "permissionIds must be an array",
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Verify all permission IDs exist
    const permissions = await Permission.findAll({
      where: { id: permissionIds },
    });

    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some permission IDs are invalid",
      });
    }

    // Remove existing permissions
    await RolePermission.destroy({ where: { roleId } });

    // Add new permissions
    const rolePermissions = permissionIds.map((permissionId) => ({
      roleId: Number(roleId),
      permissionId,
    }));

    await RolePermission.bulkCreate(rolePermissions);

    // Get updated role with permissions
    const updatedRole = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    return res.json({
      success: true,
      message: "Permissions assigned successfully",
      data: {
        role: {
          id: updatedRole?.id,
          name: updatedRole?.name,
        },
        permissions: (updatedRole as any)?.permissions || [],
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to assign permissions",
    });
  }
};

/**
 * Add single permission to role
 * POST /api/permissions/role/:roleId/add
 * Body: { permissionId: 1 }
 * Role: ADMIN
 */
export const addPermissionToRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    if (!permissionId) {
      return res.status(400).json({
        success: false,
        message: "permissionId is required",
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Check if already exists
    const existing = await RolePermission.findOne({
      where: { roleId, permissionId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Permission already assigned to this role",
      });
    }

    await RolePermission.create({
      roleId: Number(roleId),
      permissionId,
    });

    return res.json({
      success: true,
      message: "Permission added successfully",
      data: {
        roleId,
        permission,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to add permission",
    });
  }
};

/**
 * Remove permission from role
 * DELETE /api/permissions/role/:roleId/remove/:permissionId
 * Role: ADMIN
 */
export const removePermissionFromRole = async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId } = req.params;

    const deleted = await RolePermission.destroy({
      where: { roleId, permissionId },
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: "Permission not found for this role",
      });
    }

    return res.json({
      success: true,
      message: "Permission removed successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to remove permission",
    });
  }
};

/**
 * Create new permission
 * POST /api/permissions
 * Body: { name: "medicines.view", description: "View medicines", module: "medicines" }
 * Role: ADMIN
 */
export const createPermission = async (req: Request, res: Response) => {
  try {
    const { name, description, module } = req.body;

    if (!name || !module) {
      return res.status(400).json({
        success: false,
        message: "name and module are required",
      });
    }

    // Check if permission already exists
    const existing = await Permission.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Permission with this name already exists",
      });
    }

    const permission = await Permission.create({
      name,
      description,
      module,
    });

    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create permission",
    });
  }
};

/**
 * Delete permission
 * DELETE /api/permissions/:id
 * Role: ADMIN
 */
export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Remove from all roles first
    await RolePermission.destroy({ where: { permissionId: id } });

    const deleted = await Permission.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    return res.json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete permission",
    });
  }
};

/**
 * Get all modules with their permissions
 * GET /api/permissions/modules
 * Role: ADMIN
 */
export const getModulesWithPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await Permission.findAll({
      order: [["module", "ASC"], ["name", "ASC"]],
    });

    // Group by module and categorize by action (view, create, edit, delete)
    const modules: any = {};

    permissions.forEach((permission: any) => {
      const module = permission.module;
      const nameParts = permission.name.split(".");
      const action = nameParts[1] || "other";

      if (!modules[module]) {
        modules[module] = {
          module,
          permissions: {
            view: null,
            create: null,
            edit: null,
            delete: null,
            other: [],
          },
        };
      }

      const permData = {
        id: permission.id,
        name: permission.name,
        description: permission.description,
      };

      if (["view", "create", "edit", "delete"].includes(action)) {
        modules[module].permissions[action] = permData;
      } else {
        modules[module].permissions.other.push(permData);
      }
    });

    return res.json({
      success: true,
      message: "Modules with permissions retrieved successfully",
      data: Object.values(modules),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to get modules",
    });
  }
};