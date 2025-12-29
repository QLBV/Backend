import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import Medicine from "./Medicine";

interface MedicineImportAttributes {
  id: number;
  medicineId: number;
  quantity: number;
  importPrice: number;
  importDate: Date;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MedicineImportCreationAttributes
  extends Optional<MedicineImportAttributes, "id"> {}

class MedicineImport
  extends Model<MedicineImportAttributes, MedicineImportCreationAttributes>
  implements MedicineImportAttributes
{
  public id!: number;
  public medicineId!: number;
  public quantity!: number;
  public importPrice!: number;
  public importDate!: Date;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MedicineImport.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    medicineId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: Medicine, key: "id" },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    importPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    importDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "MedicineImport",
    tableName: "medicine_imports",
  }
);

MedicineImport.belongsTo(Medicine, {
  foreignKey: "medicineId",
  as: "medicine",
});

export default MedicineImport;
