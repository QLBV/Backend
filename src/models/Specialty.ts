import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface SpecialtyAttributes {
  id: number;
  name: string;
  description?: string;
}

interface SpecialtyCreationAttributes extends Optional<SpecialtyAttributes, "id"> {}

class Specialty
  extends Model<SpecialtyAttributes, SpecialtyCreationAttributes>
  implements SpecialtyAttributes
{
  public id!: number;
  public name!: string;
  public description?: string;
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
  },
  {
    sequelize,
    tableName: "specialties",
    timestamps: true,
  }
);

export default Specialty;