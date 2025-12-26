import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

interface MedicineAttributes {
  id: number;
  name: string;
  group: string;
  unit: string;
  importPrice: number;
  salePrice: number;
  expiryDate: Date;
  quantity: number;
  status: string; //'active', 'expired', 'removed'
  createdAt?: Date;
  updatedAt?: Date;
}

interface MedicineCreationAttributes
  extends Optional<MedicineAttributes, "id"> {}

class Medicine
  extends Model<MedicineAttributes, MedicineCreationAttributes>
  implements MedicineAttributes
{
  public id!: number;
  public name!: string;
  public group!: string;
  public unit!: string;
  public importPrice!: number;
  public salePrice!: number;
  public expiryDate!: Date;
  public quantity!: number;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Medicine.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    importPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    salePrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "Medicine",
    tableName: "medicines",
  }
);

export default Medicine;
