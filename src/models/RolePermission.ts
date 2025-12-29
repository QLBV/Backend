import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Role from "./Role";
import Permission from "./Permission";

interface RolePermissionAttributes {
  roleId: number;
  permissionId: number;
}

class RolePermission
  extends Model<RolePermissionAttributes>
  implements RolePermissionAttributes
{
  public roleId!: number;
  public permissionId!: number;
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: {
        model: Role,
        key: "id",
      },
    },
    permissionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: {
        model: Permission,
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "role_permissions",
    timestamps: false,
  }
);

export default RolePermission;
