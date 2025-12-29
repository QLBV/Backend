import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum PayrollStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  PAID = "PAID",
}

interface PayrollAttributes {
  id: number;
  payrollCode: string;
  userId: number;

  // Period
  month: number;
  year: number;

  // Salary Components
  baseSalary: number;
  roleCoefficient: number;
  roleSalary: number;
  yearsOfService: number;
  experienceBonus: number;

  // Commission
  totalInvoices: number;
  commissionRate: number;
  commission: number;

  // Deductions
  daysOff: number;
  allowedDaysOff: number;
  penaltyDaysOff: number;
  penaltyAmount: number;

  // Total
  grossSalary: number;
  netSalary: number;

  // Status
  status: PayrollStatus;
  approvedBy?: number;
  approvedAt?: Date;
  paidAt?: Date;

  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PayrollCreationAttributes
  extends Optional<
    PayrollAttributes,
    | "id"
    | "payrollCode"
    | "baseSalary"
    | "yearsOfService"
    | "experienceBonus"
    | "totalInvoices"
    | "commissionRate"
    | "commission"
    | "daysOff"
    | "allowedDaysOff"
    | "penaltyDaysOff"
    | "penaltyAmount"
    | "status"
    | "approvedBy"
    | "approvedAt"
    | "paidAt"
    | "note"
  > {}

class Payroll
  extends Model<PayrollAttributes, PayrollCreationAttributes>
  implements PayrollAttributes
{
  public id!: number;
  public payrollCode!: string;
  public userId!: number;

  public month!: number;
  public year!: number;

  public baseSalary!: number;
  public roleCoefficient!: number;
  public roleSalary!: number;
  public yearsOfService!: number;
  public experienceBonus!: number;

  public totalInvoices!: number;
  public commissionRate!: number;
  public commission!: number;

  public daysOff!: number;
  public allowedDaysOff!: number;
  public penaltyDaysOff!: number;
  public penaltyAmount!: number;

  public grossSalary!: number;
  public netSalary!: number;

  public status!: PayrollStatus;
  public approvedBy?: number;
  public approvedAt?: Date;
  public paidAt?: Date;

  public note?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: any;
  public readonly approver?: any;
}

Payroll.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    payrollCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    // Period
    month: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    // Salary Components
    baseSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 2500000,
    },
    roleCoefficient: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    roleSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    yearsOfService: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    experienceBonus: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Commission
    totalInvoices: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.05,
    },
    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Deductions
    daysOff: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    allowedDaysOff: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 2,
    },
    penaltyDaysOff: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Total
    grossSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    netSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    // Status
    status: {
      type: DataTypes.ENUM(...Object.values(PayrollStatus)),
      allowNull: false,
      defaultValue: PayrollStatus.DRAFT,
    },
    approvedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidAt: {
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
    tableName: "payrolls",
    timestamps: true,
  }
);

export default Payroll;
