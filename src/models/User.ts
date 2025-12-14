import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Role from "./Role";

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  fullName: string;
  roleId: number;
  isActive: boolean;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "isActive"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public password!: string;
  public fullName!: string;
  public roleId!: number;
  public isActive!: boolean;

  public Role?: {
    name: string;
  };
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  }
);

/* ASSOCIATIONS */
User.belongsTo(Role, { foreignKey: "roleId" });
Role.hasMany(User, { foreignKey: "roleId" });

export default User;
