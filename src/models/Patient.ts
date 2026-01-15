import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import PatientProfile from "./PatientProfile";
import User from "./User";

interface PatientAttributes {
  id: number;
  patientCode: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: Date;
  avatar?: string | null;
  cccd?: string;
  userId?: number;
  isActive: boolean;
  bloodType?: string | null;
  height?: number | null;
  weight?: number | null;
  chronicDiseases?: string[] | null;
  allergies?: string[] | null;
  noShowCount?: number;
  lastNoShowDate?: Date | null;
}

interface PatientCreationAttributes
  extends Optional<PatientAttributes, "id" | "patientCode" | "isActive"> {}

class Patient
  extends Model<PatientAttributes, PatientCreationAttributes>
  implements PatientAttributes
{
  public id!: number;
  public patientCode!: string;
  public fullName!: string;
  public gender!: "MALE" | "FEMALE" | "OTHER";
  public dateOfBirth!: Date;
  public avatar?: string | null;
  public cccd?: string | undefined;
  public userId?: number;
  public isActive!: boolean;
  public bloodType?: string | null;
  public height?: number | null;
  public weight?: number | null;
  public chronicDiseases?: string[] | null;
  public allergies?: string[] | null;
  noShowCount?: number;
  lastNoShowDate?: Date | null;
  
  declare profiles?: PatientProfile[];
}

Patient.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    patientCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      field: "patientCode",
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "fullName",
    },
    gender: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
      allowNull: false,
      field: "gender",
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "dateOfBirth",
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "avatar",
    },
    cccd: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      field: "cccd",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "userId",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "isActive",
    },
    
    bloodType: {
      type: DataTypes.ENUM('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
      allowNull: true,
      field: "bloodType",
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: "height",
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: "weight",
    },
    chronicDiseases: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      field: "chronicDiseases",
    },
    allergies: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      field: "allergies",
    },
    noShowCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      field: "noShowCount",
      comment: "Number of times patient missed appointments without notice",
    },
    lastNoShowDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "lastNoShowDate",
      comment: "Date of most recent no-show incident",
    },
  },
  {
    sequelize,
    tableName: "patients",
    timestamps: true,
    hooks: {
      afterUpdate: async (patient: Patient, options: any) => {
        if (options.syncing || !patient.userId) return;
        if (patient.changed("isActive")) {
          await sequelize.models.User.update(
            { isActive: patient.isActive },
            { where: { id: patient.userId }, hooks: false } as any
          );
        }
        const Employee = sequelize.models.Employee;
        if (Employee) {
          const changed = ["gender", "dateOfBirth", "cccd", "avatar", "patientCode", "isActive"].some(f => patient.changed(f as any));
          if (changed) {
            await Employee.update({
              employeeCode: patient.patientCode,
              gender: patient.gender,
              dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toString() : undefined,
              cccd: patient.cccd,
              avatar: patient.avatar,
              isActive: patient.isActive
            }, { where: { userId: patient.userId }, hooks: false } as any);
          }
        }
      }
    }
  }
);

export default Patient;
