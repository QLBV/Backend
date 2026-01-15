// models/Visit.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from ".";
import Appointment from "./Appointment";
import Doctor from "./Doctor";
import Patient from "./Patient";

export type VisitStatus = "WAITING" | "EXAMINING" | "EXAMINED" | "COMPLETED" | "CANCELLED";

export default class Visit extends Model {
  declare id: number;
  declare visitCode: string;
  declare appointmentId: number;
  declare patientId: number;
  declare doctorId: number;
  declare checkInTime: Date;
  declare checkOutTime?: Date;
  declare symptoms?: string;
  declare diseaseCategoryId?: number;
  declare diagnosis?: string;
  declare note?: string;
  declare status: VisitStatus;
  declare doctorSignature?: string;
  declare signedAt?: Date;
  declare vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    weight?: number;
    height?: number;
    spo2?: number;
  };
  declare referralData?: {
    referrals: Array<{
      id: number;
      fromDoctorId: number;
      toDoctorId: number;
      toSpecialtyId: number;
      reason?: string;
      isCompleted: boolean;
      createdAt: string;
      completedAt?: string;
      note?: string;
      vitalSignsUpdate?: any;
    }>;
  };
}

Visit.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    visitCode: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    appointmentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    patientId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    doctorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    checkInTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    symptoms: { type: DataTypes.TEXT },
    diseaseCategoryId: { type: DataTypes.INTEGER.UNSIGNED },
    diagnosis: { type: DataTypes.TEXT },
    note: { type: DataTypes.TEXT },
    checkOutTime: { type: DataTypes.DATE, allowNull: true },
    vitalSigns: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("WAITING", "EXAMINING", "EXAMINED", "COMPLETED"),
      defaultValue: "WAITING",
    },
    referralData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Stores referral history: [{fromDoctorId, toDoctorId, reason, ...}]",
    },
    doctorSignature: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Digital signature or hash of doctor's approval (for compliance)",
    },
    signedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when doctor signed the diagnosis",
    },
  },
  {
    sequelize,
    tableName: "visits",
    timestamps: true,
  }
);
