import { DataTypes, Model } from "sequelize";
import { sequelize } from "./index";
import Patient from "./Patient";
import Doctor from "./Doctor";
import Shift from "./Shift";

export default class Appointment extends Model {
  declare id: number;
  declare appointmentCode: string;
  declare patientId: number;
  declare doctorId: number;
  declare shiftId: number;
  declare date: Date;
  declare slotNumber: number;
  declare bookingType: "ONLINE" | "OFFLINE";
  declare bookedBy: "PATIENT" | "RECEPTIONIST";
  declare symptomInitial?: string;
  declare patientName?: string;
  declare patientPhone?: string;
  declare patientDob?: string | Date;
  declare patientGender?: "MALE" | "FEMALE" | "OTHER";
  declare symptomImages?: string[]; 
  declare queueNumber?: number | null;
  declare status:
    | "WAITING"
    | "CHECKED_IN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    appointmentCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "appointmentCode",
    },
    patientId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    doctorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    shiftId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
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
    patientName: { type: DataTypes.STRING(100), allowNull: true },
    patientPhone: { type: DataTypes.STRING(20), allowNull: true },
    patientDob: { type: DataTypes.DATEONLY, allowNull: true },
    patientGender: { type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"), allowNull: true },
    symptomImages: { type: DataTypes.JSON }, 
    queueNumber: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "WAITING",
        "CHECKED_IN",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW"
      ),
      defaultValue: "WAITING",
    },
  },
  {
    sequelize,
    tableName: "appointments",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["doctorId", "shiftId", "date", "slotNumber"],
        name: "appointments_slot_unique",
      },
    ],
  }
);
