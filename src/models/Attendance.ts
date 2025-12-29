import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LEAVE = "LEAVE",
  SICK_LEAVE = "SICK_LEAVE",
}

interface AttendanceAttributes {
  id: number;
  userId: number;
  date: Date;
  status: AttendanceStatus;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AttendanceCreationAttributes
  extends Optional<AttendanceAttributes, "id" | "status" | "note"> {}

class Attendance
  extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes
{
  public id!: number;
  public userId!: number;
  public date!: Date;
  public status!: AttendanceStatus;
  public note?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: any;
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AttendanceStatus)),
      allowNull: false,
      defaultValue: AttendanceStatus.PRESENT,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "attendance",
    timestamps: true,
  }
);

export default Attendance;
