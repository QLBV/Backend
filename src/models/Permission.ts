import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface PermissionAttributes {
  id: number;
  name: string;
  description?: string;
  module: string;
}

interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, "id"> {}

class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  public id!: number;
  public name!: string;
  public description?: string;
  public module!: string;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "permissions",
    timestamps: true,
  }
);

export default Permission;
