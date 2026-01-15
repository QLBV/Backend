import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";


interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}
interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface SystemSettingsConfig {
  maintenanceMode: boolean;
  allowOnlineBooking: boolean;
  allowOfflineBooking: boolean;
  maxAppointmentsPerDay: number;
  appointmentDuration: number;
  currency: string;
  timezone: string;
}

interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
}

interface SystemSettingsAttributes {
  id: number;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite?: string;
  businessHours: BusinessHours;
  systemSettings: SystemSettingsConfig;
  emailSettings: EmailSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SystemSettingsCreationAttributes
  extends Optional<SystemSettingsAttributes, "id" | "clinicWebsite"> {}

class SystemSettings
  extends Model<SystemSettingsAttributes, SystemSettingsCreationAttributes>
  implements SystemSettingsAttributes
{
  public id!: number;
  public clinicName!: string;
  public clinicAddress!: string;
  public clinicPhone!: string;
  public clinicEmail!: string;
  public clinicWebsite?: string;
  public businessHours!: BusinessHours;
  public systemSettings!: SystemSettingsConfig;
  public emailSettings!: EmailSettings;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemSettings.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    clinicName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    clinicAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    clinicPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    clinicEmail: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    clinicWebsite: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    businessHours: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        monday: { open: "08:00", close: "17:00", closed: false },
        tuesday: { open: "08:00", close: "17:00", closed: false },
        wednesday: { open: "08:00", close: "17:00", closed: false },
        thursday: { open: "08:00", close: "17:00", closed: false },
        friday: { open: "08:00", close: "17:00", closed: false },
        saturday: { open: "08:00", close: "12:00", closed: false },
        sunday: { open: "", close: "", closed: true },
      },
    },
    systemSettings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        maintenanceMode: false,
        allowOnlineBooking: true,
        allowOfflineBooking: true,
        maxAppointmentsPerDay: 50,
        appointmentDuration: 30,
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
      },
    },
    emailSettings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        fromEmail: "",
        fromName: "",
      },
    },
  },
  {
    sequelize,
    tableName: "system_settings",
    timestamps: true,
  }
);

export default SystemSettings;
export type { BusinessHours, SystemSettingsConfig, EmailSettings };
