import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  VIEW = "VIEW",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
}

interface AuditLogAttributes {
  id: number;
  userId?: number;
  action: AuditAction;
  tableName: string;
  recordId?: number;
  oldValue?: object;
  newValue?: object;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuditLogCreationAttributes
  extends Optional<
    AuditLogAttributes,
    | "id"
    | "userId"
    | "recordId"
    | "oldValue"
    | "newValue"
    | "ipAddress"
    | "userAgent"
    | "timestamp"
  > {}

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: number;
  public userId?: number;
  public action!: AuditAction;
  public tableName!: string;
  public recordId?: number;
  public oldValue?: object;
  public newValue?: object;
  public ipAddress?: string;
  public userAgent?: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: "User who performed the action (NULL for system actions)",
    },
    action: {
      type: DataTypes.ENUM(...Object.values(AuditAction)),
      allowNull: false,
    },
    tableName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Name of the affected table",
    },
    recordId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "ID of the affected record",
    },
    oldValue: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Previous state (for UPDATE/DELETE)",
    },
    newValue: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "New state (for CREATE/UPDATE)",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "IPv4 or IPv6 address",
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Browser/client information",
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
    timestamps: true,
    indexes: [
      {
        name: "idx_audit_user",
        fields: ["userId"],
      },
      {
        name: "idx_audit_table_record",
        fields: ["tableName", "recordId"],
      },
      {
        name: "idx_audit_timestamp",
        fields: ["timestamp"],
      },
    ],
  }
);

export default AuditLog;
