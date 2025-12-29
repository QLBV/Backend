import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import Medicine from "./Medicine";

interface MedicineExportAttributes {
  id: number;
  medicineId: number;
  quantity: number;
  exportDate: Date;
  userId: number;
  reason: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MedicineExportCreationAttributes
  extends Optional<MedicineExportAttributes, "id"> {}

class MedicineExport
  extends Model<MedicineExportAttributes, MedicineExportCreationAttributes>
  implements MedicineExportAttributes
{
  public id!: number;
  public medicineId!: number;
  public quantity!: number;
  public exportDate!: Date;
  public userId!: number;
  public reason!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MedicineExport.init(
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
    exportDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "MedicineExport",
    tableName: "medicine_exports",
    timestamps: true,
  }
);

export default MedicineExport;
