import { DataTypes, Model } from "sequelize";
import { sequelize } from ".";
import Doctor from "./Doctor";
import Shift from "./Shift";

export default class ShiftTemplate extends Model {
  declare id: number;
  declare doctorId: number;
  declare shiftId: number;
  declare dayOfWeek: number; // 1-7 (Monday to Sunday)
  declare isActive: boolean;
  declare notes?: string;
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
      references: { model: Doctor, key: "id" },
    },
    shiftId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Shift, key: "id" },
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
