import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from ".";

export enum PrescriptionStatus {
  DRAFT = "DRAFT",
  LOCKED = "LOCKED",
  CANCELLED = "CANCELLED",
}

interface PrescriptionAttributes {
  id: number;
  prescriptionCode: string;
  visitId: number;
  doctorId: number;
  patientId: number;
  totalAmount: number;
  status: PrescriptionStatus;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PrescriptionCreationAttributes
  extends Optional<PrescriptionAttributes, "id" | "note"> {}

class Prescription
  extends Model<PrescriptionAttributes, PrescriptionCreationAttributes>
  implements PrescriptionAttributes
{
  public id!: number;
  public prescriptionCode!: string;
  public visitId!: number;
  public doctorId!: number;
  public patientId!: number;
  public totalAmount!: number;
  public status!: PrescriptionStatus;
  public note?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Prescription.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    prescriptionCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    visitId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    doctorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    patientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PrescriptionStatus)),
      allowNull: false,
      defaultValue: PrescriptionStatus.DRAFT,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Prescription",
    tableName: "prescriptions",
    timestamps: true,
  }
);

export default Prescription;
