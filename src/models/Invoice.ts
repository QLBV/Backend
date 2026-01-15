import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
}

interface InvoiceAttributes {
  id: number;
  invoiceCode: string;
  visitId: number;
  patientId: number;
  doctorId: number;

  examinationFee: number;
  medicineTotalAmount: number;
  discount: number;
  totalAmount: number;

  paymentStatus: PaymentStatus;
  paidAmount: number;

  note?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvoiceCreationAttributes
  extends Optional<
    InvoiceAttributes,
    | "id"
    | "invoiceCode"
    | "medicineTotalAmount"
    | "discount"
    | "totalAmount"
    | "paymentStatus"
    | "paidAmount"
    | "note"
  > {}

class Invoice
  extends Model<InvoiceAttributes, InvoiceCreationAttributes>
  implements InvoiceAttributes
{
  public id!: number;
  public invoiceCode!: string;
  public visitId!: number;
  public patientId!: number;
  public doctorId!: number;

  public examinationFee!: number;
  public medicineTotalAmount!: number;
  public discount!: number;
  public totalAmount!: number;

  public paymentStatus!: PaymentStatus;
  public paidAmount!: number;

  public note?: string;
  public createdBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly visit?: any;
  public readonly patient?: any;
  public readonly doctor?: any;
  public readonly creator?: any;
  public readonly items?: any[];
  public readonly payments?: any[];
}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    invoiceCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    visitId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: {
        model: "visits",
        key: "id",
      },
    },
    patientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    doctorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "doctors",
        key: "id",
      },
    },
    examinationFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    medicineTotalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.UNPAID,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "invoices",
    timestamps: true,
  }
);

export default Invoice;
