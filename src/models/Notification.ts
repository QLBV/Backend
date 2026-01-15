import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Appointment from "./Appointment";


export enum NotificationType {
  APPOINTMENT_CREATED = "APPOINTMENT_CREATED",
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  DOCTOR_CHANGED = "DOCTOR_CHANGED",
  APPOINTMENT_RESCHEDULED = "APPOINTMENT_RESCHEDULED",
  SYSTEM = "SYSTEM",
}

export interface NotificationAttributes {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedAppointmentId?: number | null;
  isRead: boolean;
  emailSent: boolean;
  emailSentAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    | "id"
    | "isRead"
    | "emailSent"
    | "emailSentAt"
    | "relatedAppointmentId"
    | "createdAt"
    | "updatedAt"
  > {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: number;
  public userId!: number;
  public type!: NotificationType;
  public title!: string;
  public message!: string;
  public relatedAppointmentId?: number | null;
  public isRead!: boolean;
  public emailSent!: boolean;
  public emailSentAt?: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relatedAppointmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: Appointment, key: "id" },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "notifications",
    timestamps: true,
    indexes: [
      { fields: ["userId", "isRead"] },
      { fields: ["userId", "createdAt"] },
    ],
  }
);

Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
Notification.belongsTo(Appointment, {
  foreignKey: "relatedAppointmentId",
  as: "appointment",
});

export default Notification;
