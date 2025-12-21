import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface ShiftAttributes {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface ShiftCreationAttributes extends Optional<ShiftAttributes, "id"> {}

class Shift
  extends Model<ShiftAttributes, ShiftCreationAttributes>
  implements ShiftAttributes
{
  public id!: number;
  public name!: string;
  public startTime!: string;
  public endTime!: string;
}

Shift.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    startTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "shifts",
    timestamps: true,
  }
);

export default Shift;
