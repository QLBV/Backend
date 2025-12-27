import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
}

interface InvoiceAttributes {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  total: number;
  paymentMethod?: PaymentMethod;
  status: InvoiceStatus;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvoiceCreationAttributes
  extends Optional<
    InvoiceAttributes,
    "id" | "paymentMethod" | "note" | "status"
  > {}

class Invoice
  extends Model<InvoiceAttributes, InvoiceCreationAttributes>
  implements InvoiceAttributes
{
  public id!: number;
  public appointmentId!: number;
  public patientId!: number;
  public doctorId!: number;
  public total!: number;
  public paymentMethod?: PaymentMethod;
  public status!: InvoiceStatus;
  public note?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    patientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    doctorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
      allowNull: false,
      defaultValue: InvoiceStatus.UNPAID,
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "invoices",
    timestamps: true,
  }
);

export default Invoice;
