import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import PatientContact from "./PatientContact";

interface PatientAttributes {
  id: number;
  patientCode: string;
  fullName: string;
  gender: "male" | "female" | "other";
  dateOfBirth: Date;
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
  public gender!: "male" | "female" | "other";
  public dateOfBirth!: Date;
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
      field: "patient_code",
    },

    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: false,
    },

    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "dob",
    },

    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "user_id",
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    sequelize,
    tableName: "patients",
    timestamps: true,
  }
);

// associations
Patient.hasMany(PatientContact, {
  foreignKey: "patientId",
  as: "contacts",
});

PatientContact.belongsTo(Patient, {
  foreignKey: "patientId",
});

export default Patient;
