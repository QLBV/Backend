import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface SpecialtyAttributes {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

interface SpecialtyCreationAttributes extends Optional<SpecialtyAttributes, "id" | "isActive"> {}

class Specialty
  extends Model<SpecialtyAttributes, SpecialtyCreationAttributes>
  implements SpecialtyAttributes
{
  public id!: number;
  public name!: string;
  public description?: string;
  public isActive!: boolean;
}

Specialty.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "specialties",
    timestamps: true,
  }
);

export default Specialty;