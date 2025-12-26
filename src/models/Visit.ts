// models/Visit.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from ".";
import Appointment from "./Appointment";
import Doctor from "./Doctor";
import Patient from "./Patient";

export default class Visit extends Model {
  declare id: number;
  declare appointmentId: number;
  declare patientId: number;
  declare doctorId: number;
  declare checkInTime: Date;
  declare symptoms?: string;
  declare diseaseCategoryId?: number;
  declare diagnosis?: string;
  declare note?: string;
  declare status: "EXAMINING" | "COMPLETED";
}

Visit.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    appointmentId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    checkInTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    symptoms: { type: DataTypes.TEXT },
    diseaseCategoryId: { type: DataTypes.INTEGER.UNSIGNED },
    diagnosis: { type: DataTypes.TEXT },
    note: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM("EXAMINING", "COMPLETED"),
      defaultValue: "EXAMINING",
    },
  },
  {
    sequelize,
    tableName: "visits",
  }
);

// Associations
Visit.belongsTo(Appointment, { foreignKey: "appointmentId" });
Visit.belongsTo(Patient, { foreignKey: "patientId" });
Visit.belongsTo(Doctor, { foreignKey: "doctorId" });
