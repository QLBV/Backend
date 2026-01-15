import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface NotificationSettingAttributes {
  id: number;
  userId: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  appointmentReminders: boolean; 
  prescriptionReminders: boolean; 
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationSettingCreationAttributes
  extends Optional<
    NotificationSettingAttributes,
    "id" | "emailEnabled" | "smsEnabled" | "pushEnabled" | "inAppEnabled" | "appointmentReminders" | "prescriptionReminders"
  > {}

class NotificationSetting
  extends Model<NotificationSettingAttributes, NotificationSettingCreationAttributes>
  implements NotificationSettingAttributes
{
  public id!: number;
  public userId!: number;
  public emailEnabled!: boolean;
  public smsEnabled!: boolean;
  public pushEnabled!: boolean;
  public inAppEnabled!: boolean;
  public appointmentReminders!: boolean;
  public prescriptionReminders!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NotificationSetting.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: "userId",
    },
    emailEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    smsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pushEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    inAppEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    appointmentReminders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    prescriptionReminders: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "notification_settings",
    timestamps: true,
  }
);

export default NotificationSetting;
