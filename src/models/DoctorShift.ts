import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Doctor from "./Doctor";
import Shift from "./Shift";

export enum DoctorShiftStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  REPLACED = "REPLACED",
}

interface DoctorShiftAttributes {
  id: number;
  doctorId: number;
  shiftId: number;
  workDate: string;
  status: DoctorShiftStatus;
  replacedBy?: number | null;
  cancelReason?: string | null;
  maxSlots?: number | null;
}

interface DoctorShiftCreationAttributes
  extends Optional<DoctorShiftAttributes, "id" | "status" | "replacedBy" | "cancelReason" | "maxSlots"> {}

class DoctorShift
  extends Model<DoctorShiftAttributes, DoctorShiftCreationAttributes>
  implements DoctorShiftAttributes
{
  public id!: number;
  public doctorId!: number;
  public shiftId!: number;
  public workDate!: string;
  public status!: DoctorShiftStatus;
  public replacedBy?: number | null;
  public cancelReason?: string | null;
  public maxSlots?: number | null;
  public shift?: Shift;
  public doctor?: Doctor;
}

DoctorShift.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Doctor, key: "id" },
    },
    shiftId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Shift, key: "id" },
    },
    workDate: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DoctorShiftStatus)),
      allowNull: false,
      defaultValue: DoctorShiftStatus.ACTIVE,
    },
    replacedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: Doctor, key: "id" },
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maxSlots: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "doctor_shifts",
    timestamps: true,
    indexes: [{ unique: true, fields: ["doctorId", "shiftId", "workDate"] }],
  }
);

export default DoctorShift;
