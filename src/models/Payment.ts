import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  QR_CODE = "QR_CODE",
}

interface PaymentAttributes {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  reference?: string;
  note?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes
  extends Optional<
    PaymentAttributes,
    "id" | "paymentDate" | "reference" | "note"
  > {}

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: number;
  public invoiceId!: number;
  public amount!: number;
  public paymentMethod!: PaymentMethod;
  public paymentDate!: Date;
  public reference?: string;
  public note?: string;
  public createdBy!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly invoice?: any;
  public readonly creator?: any;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    invoiceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "invoices",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: "Payment amount must be greater than 0",
        },
      },
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reference: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
    tableName: "payments",
    timestamps: true,
  }
);

export default Payment;
