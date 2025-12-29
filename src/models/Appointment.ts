import { DataTypes, Model } from "sequelize";
import { sequelize } from ".";
import Patient from "./Patient";
import Doctor from "./Doctor";
import Shift from "./Shift";

export default class Appointment extends Model {
  declare id: number;
  declare patientId: number;
  declare doctorId: number;
  declare shiftId: number;
  declare date: Date;
  declare slotNumber: number;
  declare bookingType: "ONLINE" | "OFFLINE";
  declare bookedBy: "PATIENT" | "RECEPTIONIST";
  declare symptomInitial?: string;
  declare status: "WAITING" | "CANCELLED" | "CHECKED_IN";
}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    shiftId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    slotNumber: { type: DataTypes.INTEGER, allowNull: false },
    bookingType: {
      type: DataTypes.ENUM("ONLINE", "OFFLINE"),
      allowNull: false,
    },
    bookedBy: {
      type: DataTypes.ENUM("PATIENT", "RECEPTIONIST"),
      allowNull: false,
    },
    symptomInitial: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM("WAITING", "CANCELLED", "CHECKED_IN"),
      defaultValue: "WAITING",
    },
  },
  {
    sequelize,
    tableName: "appointments",
    indexes: [
      {
        unique: true,
        fields: ["doctorId", "shiftId", "date", "slotNumber"], // ❗ chặn trùng
      },
    ],
  }
);

// Associations
Appointment.belongsTo(Patient, { foreignKey: "patientId" });
Appointment.belongsTo(Doctor, { foreignKey: "doctorId" });
Appointment.belongsTo(Shift, { foreignKey: "shiftId" });
