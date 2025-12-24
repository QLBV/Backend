import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import PatientProfile from "./PatientProfile";

interface PatientAttributes {
  id: number;
  patientCode: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: Date;
  avatar?: string | null;
  cccd?: string;
  userId?: number;
  isActive: boolean;
}

interface PatientCreationAttributes
  extends Optional<PatientAttributes, "id" | "patientCode" | "isActive"> {}

class Patient
  extends Model<PatientAttributes, PatientCreationAttributes>
  implements PatientAttributes
{
  public id!: number;
  public patientCode!: string;
  public fullName!: string;
  public gender!: "MALE" | "FEMALE" | "OTHER";
  public dateOfBirth!: Date;
  public avatar?: string | null;
  public cccd?: string | undefined;
  public userId?: number;
  public isActive!: boolean;
}

Patient.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    patientCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      field: "patientCode",
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "fullName",
    },
    gender: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
      allowNull: false,
      field: "gender",
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "dateOfBirth",
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "avatar",
    },
    cccd: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      field: "cccd",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "userId",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "isActive",
    },
  },
  {
    sequelize,
    tableName: "patients",
    timestamps: true,
  }
);

Patient.hasMany(PatientProfile, {
  foreignKey: "patientId",
  as: "profiles",
});

PatientProfile.belongsTo(Patient, {
  foreignKey: "patientId",
});

export default Patient;
