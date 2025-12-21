import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Doctor from "./Doctor";
import Shift from "./Shifts";

interface DoctorShiftAttributes {
  id: number;
  doctorId: number;
  shiftId: number;
  workDate: string;
}

interface DoctorShiftCreationAttributes
  extends Optional<DoctorShiftAttributes, "id"> {}

class DoctorShift
  extends Model<DoctorShiftAttributes, DoctorShiftCreationAttributes>
  implements DoctorShiftAttributes
{
  public id!: number;
  public doctorId!: number;
  public shiftId!: number;
  public workDate!: string;
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
  },
  {
    sequelize,
    tableName: "doctor_shifts",
    timestamps: true,
  }
);

DoctorShift.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });
DoctorShift.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });

export default DoctorShift;
