import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Specialty from "./Specialty";

interface DoctorAttributes {
  id: number;
  doctorCode: string;
  userId: number;
  specialtyId: number;
  position?: string;
  degree?: string;
  description?: string;
}

interface DoctorCreationAttributes
  extends Optional<DoctorAttributes, "id" | "doctorCode"> {}

class Doctor
  extends Model<DoctorAttributes, DoctorCreationAttributes>
  implements DoctorAttributes
{
  public id!: number;
  public doctorCode!: string;
  public userId!: number;
  public specialtyId!: number;
  public position?: string;
  public degree?: string;
  public description?: string;
}

Doctor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    specialtyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Specialty, key: "id" },
    },
    position: {
      type: DataTypes.STRING(100),
    },
    degree: {
      type: DataTypes.STRING(100),
    },
    description: {
      type: DataTypes.STRING(255),
    },
  },
  {
    sequelize,
    tableName: "doctors",
    timestamps: true,
  }
);

Doctor.belongsTo(User, { foreignKey: "userId", as: "user" });
Doctor.belongsTo(Specialty, { foreignKey: "specialtyId", as: "specialty" });

export default Doctor;
