import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from ".";

interface PrescriptionDetailAttributes {
  id: number;
  prescriptionId: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  dosageMorning: number;
  dosageNoon: number;
  dosageAfternoon: number;
  dosageEvening: number;
  instruction?: string;
  days?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PrescriptionDetailCreationAttributes
  extends Optional<PrescriptionDetailAttributes, "id" | "instruction"> {}

class PrescriptionDetail
  extends Model<
    PrescriptionDetailAttributes,
    PrescriptionDetailCreationAttributes
  >
  implements PrescriptionDetailAttributes
{
  public id!: number;
  public prescriptionId!: number;
  public medicineId!: number;
  public medicineName!: string;
  public quantity!: number;
  public unit!: string;
  public unitPrice!: number;
  public dosageMorning!: number;
  public dosageNoon!: number;
  public dosageAfternoon!: number;
  public dosageEvening!: number;
  public instruction?: string;
  public days?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PrescriptionDetail.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    prescriptionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    medicineId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    medicineName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dosageMorning: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    dosageNoon: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    dosageAfternoon: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    dosageEvening: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    instruction: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: "PrescriptionDetail",
    tableName: "prescription_details",
    timestamps: true,
  }
);

export default PrescriptionDetail;
