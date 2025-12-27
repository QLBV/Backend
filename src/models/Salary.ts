import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum SalaryStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

interface SalaryAttributes {
  id: number;
  doctorId: number;
  month: number; // 1-12
  year: number;
  baseSalary: number;
  bonus: number;
  penalty: number;
  total: number;
  status: SalaryStatus;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SalaryCreationAttributes
  extends Optional<
    SalaryAttributes,
    "id" | "bonus" | "penalty" | "note" | "status"
  > {}

class Salary
  extends Model<SalaryAttributes, SalaryCreationAttributes>
  implements SalaryAttributes
{
  public id!: number;
  public doctorId!: number;
  public month!: number;
  public year!: number;
  public baseSalary!: number;
  public bonus!: number;
  public penalty!: number;
  public total!: number;
  public status!: SalaryStatus;
  public note?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Salary.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    baseSalary: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    bonus: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    penalty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SalaryStatus)),
      allowNull: false,
      defaultValue: SalaryStatus.PENDING,
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "salaries",
    timestamps: true,
  }
);

export default Salary;
