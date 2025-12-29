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
  avatar?: string;
  userCode?: string;
  oauth2Provider?: "GOOGLE";
  oauth2Id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "isActive" | "password"> {}

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
  public avatar?: string;
  public userCode?: string;
  public oauth2Provider?: "GOOGLE";
  public oauth2Id?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

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
      allowNull: true, // Nullable for OAuth users
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
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    userCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    oauth2Provider: {
      type: DataTypes.ENUM("GOOGLE"),
      allowNull: true,
    },
    oauth2Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  }
);

export default User;
