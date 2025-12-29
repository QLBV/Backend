import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum MedicineUnit {
  VIEN = "VIEN",
  ML = "ML",
  HOP = "HOP",
  CHAI = "CHAI",
  TUYP = "TUYP",
  GOI = "GOI",
}

export enum MedicineStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  REMOVED = "REMOVED",
}

interface MedicineAttributes {
  id: number;
  medicineCode: string;
  name: string;
  group: string;
  activeIngredient?: string;
  manufacturer?: string;
  unit: MedicineUnit;
  importPrice: number;
  salePrice: number;
  quantity: number;
  minStockLevel: number;
  expiryDate: Date;
  description?: string;
  status: MedicineStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MedicineCreationAttributes
  extends Optional<
    MedicineAttributes,
    "id" | "activeIngredient" | "manufacturer" | "description" | "minStockLevel"
  > {}

class Medicine
  extends Model<MedicineAttributes, MedicineCreationAttributes>
  implements MedicineAttributes
{
  public id!: number;
  public medicineCode!: string;
  public name!: string;
  public group!: string;
  public activeIngredient?: string;
  public manufacturer?: string;
  public unit!: MedicineUnit;
  public importPrice!: number;
  public salePrice!: number;
  public quantity!: number;
  public minStockLevel!: number;
  public expiryDate!: Date;
  public description?: string;
  public status!: MedicineStatus;
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
    medicineCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    group: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    activeIngredient: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    manufacturer: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    unit: {
      type: DataTypes.ENUM(...Object.values(MedicineUnit)),
      allowNull: false,
      defaultValue: MedicineUnit.VIEN,
    },
    importPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MedicineStatus)),
      allowNull: false,
      defaultValue: MedicineStatus.ACTIVE,
    },
  },
  {
    sequelize,
    modelName: "Medicine",
    tableName: "medicines",
    timestamps: true,
  }
);

export default Medicine;
