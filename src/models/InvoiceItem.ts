import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum ItemType {
  EXAMINATION = "EXAMINATION",
  MEDICINE = "MEDICINE",
}

interface InvoiceItemAttributes {
  id: number;
  invoiceId: number;
  itemType: ItemType;

  // For EXAMINATION
  description?: string;

  // For MEDICINE
  prescriptionDetailId?: number;
  medicineName?: string;
  medicineCode?: string;

  // Pricing
  quantity: number;
  unitPrice: number;
  subtotal: number;

  createdAt?: Date;
  updatedAt?: Date;
}

interface InvoiceItemCreationAttributes
  extends Optional<
    InvoiceItemAttributes,
    | "id"
    | "description"
    | "prescriptionDetailId"
    | "medicineName"
    | "medicineCode"
    | "quantity"
    | "subtotal"
  > {}

class InvoiceItem
  extends Model<InvoiceItemAttributes, InvoiceItemCreationAttributes>
  implements InvoiceItemAttributes
{
  public id!: number;
  public invoiceId!: number;
  public itemType!: ItemType;

  public description?: string;

  public prescriptionDetailId?: number;
  public medicineName?: string;
  public medicineCode?: string;

  public quantity!: number;
  public unitPrice!: number;
  public subtotal!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly invoice?: any;
  public readonly prescriptionDetail?: any;
}

InvoiceItem.init(
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
    itemType: {
      type: DataTypes.ENUM(...Object.values(ItemType)),
      allowNull: false,
    },

    // For EXAMINATION
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // For MEDICINE
    prescriptionDetailId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "prescription_details",
        key: "id",
      },
    },
    medicineName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    medicineCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Pricing
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "invoice_items",
    timestamps: true,
  }
);

export default InvoiceItem;
