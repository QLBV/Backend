import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum RefundStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export enum RefundReason {
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  MEDICINE_RETURNED = "MEDICINE_RETURNED",
  OVERCHARGED = "OVERCHARGED",
  DUPLICATE_PAYMENT = "DUPLICATE_PAYMENT",
  OTHER = "OTHER",
}

interface RefundAttributes {
  id: number;
  invoiceId: number;
  amount: number;
  reason: RefundReason;
  reasonDetail?: string;
  status: RefundStatus;
  requestedBy: number;
  approvedBy?: number;
  requestDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RefundCreationAttributes
  extends Optional<
    RefundAttributes,
    | "id"
    | "status"
    | "requestDate"
    | "approvedBy"
    | "approvedDate"
    | "completedDate"
    | "reasonDetail"
    | "note"
  > {}

class Refund
  extends Model<RefundAttributes, RefundCreationAttributes>
  implements RefundAttributes
{
  public id!: number;
  public invoiceId!: number;
  public amount!: number;
  public reason!: RefundReason;
  public reasonDetail?: string;
  public status!: RefundStatus;
  public requestedBy!: number;
  public approvedBy?: number;
  public requestDate!: Date;
  public approvedDate?: Date;
  public completedDate?: Date;
  public note?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly invoice?: any;
  public readonly requester?: any;
  public readonly approver?: any;
}

Refund.init(
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
        min: 0.01,
      },
      comment: "Refund amount (must be positive)",
    },
    reason: {
      type: DataTypes.ENUM(...Object.values(RefundReason)),
      allowNull: false,
    },
    reasonDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Detailed explanation of refund reason",
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RefundStatus)),
      allowNull: false,
      defaultValue: RefundStatus.PENDING,
    },
    requestedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: "User who requested the refund",
    },
    approvedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: "User who approved/rejected the refund",
    },
    requestDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    approvedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "refunds",
    timestamps: true,
    indexes: [
      {
        name: "idx_refund_invoice",
        fields: ["invoiceId"],
      },
      {
        name: "idx_refund_status",
        fields: ["status"],
      },
      {
        name: "idx_refund_requested_by",
        fields: ["requestedBy"],
      },
    ],
  }
);

export default Refund;
