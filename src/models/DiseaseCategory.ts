import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from ".";

interface DiseaseCategoryAttributes {
  id: number;
  code: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DiseaseCategoryCreationAttributes
  extends Optional<DiseaseCategoryAttributes, "id" | "description"> {}

class DiseaseCategory
  extends Model<DiseaseCategoryAttributes, DiseaseCategoryCreationAttributes>
  implements DiseaseCategoryAttributes
{
  public id!: number;
  public code!: string;
  public name!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DiseaseCategory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "DiseaseCategory",
    tableName: "disease_categories",
  }
);

export default DiseaseCategory;
