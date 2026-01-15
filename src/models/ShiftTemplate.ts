import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Doctor from "./Doctor";
import Shift from "./Shift";

export default class ShiftTemplate extends Model {
  declare id: number;
  declare doctorId: number;
  declare shiftId: number;
  declare dayOfWeek: number; 
  declare isActive: boolean;
  declare notes?: string;
  declare shift?: Shift;
  declare doctor?: Doctor;
}

ShiftTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "doctor_id",
      references: { model: Doctor, key: "id" },
    },
    shiftId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "shift_id",
      references: { model: Shift, key: "id" },
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "day_of_week",
      comment: "1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "shift_templates",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["dayOfWeek"],
      },
      {
        fields: ["isActive"],
      },
    ],
  }
);
