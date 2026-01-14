import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Specialty from "./Specialty";

interface EmployeeAttributes {
  id: number;
  employeeCode: string;
  userId: number;
  specialtyId?: number | null;
  position?: string;
  degree?: string;
  description?: string;
  joiningDate?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  address?: string;
  cccd?: string;
  avatar?: string;
  expertise?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeeCreationAttributes
  extends Optional<EmployeeAttributes, "id" | "employeeCode" | "isActive"> {}

class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  public id!: number;
  public employeeCode!: string;
  public userId!: number;
  public specialtyId?: number | null;
  public position?: string;
  public degree?: string;
  public description?: string;
  public joiningDate?: string;
  public phone?: string;
  public gender?: "MALE" | "FEMALE" | "OTHER";
  public dateOfBirth?: string;
  public address?: string;
  public cccd?: string;
  public avatar?: string;
  public expertise?: string;
  public isActive!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    specialtyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: Specialty, key: "id" },
    },
    position: {
      type: DataTypes.STRING(100),
    },
    degree: {
      type: DataTypes.STRING(100),
    },
    description: {
      type: DataTypes.TEXT,
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    gender: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
    },
    address: {
      type: DataTypes.STRING(255),
    },
    cccd: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
    },
    expertise: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "employees",
    timestamps: true,
    hooks: {
      afterUpdate: async (employee: Employee, options: any) => {
        // Prevent infinite loops when syncing
        if (options.syncing) return;

        const userId = employee.userId;
        const updates: any = {};
        
        // Sync Avatar and isActive to User
        const userUpdates: any = {};
        if (employee.changed("avatar")) userUpdates.avatar = employee.avatar;
        if (employee.changed("isActive")) userUpdates.isActive = employee.isActive;
        
        if (Object.keys(userUpdates).length > 0) {
          await sequelize.models.User.update(
            userUpdates,
            { where: { id: userId }, hooks: false } as any
          );
        }

        // Sync to Doctor table if user is a doctor
        const changedInDoctor = ["specialtyId", "position", "degree", "description", "employeeCode", "isActive"].some(f => employee.changed(f as any));
        if (changedInDoctor) {
          const doctorUpdates: any = {
            doctorCode: employee.employeeCode,
            specialtyId: employee.specialtyId,
            position: employee.position,
            degree: employee.degree,
            description: employee.description
          };
          
          // Check if isActive exists in Doctor table first to avoid "Unknown column" error
          // Or just add it to the migration
          if (employee.changed("isActive")) {
            doctorUpdates.isActive = employee.isActive;
          }

          await sequelize.models.Doctor.update(doctorUpdates, { 
            where: { userId }, 
            hooks: false 
          } as any);
        }

        // Sync to Patient table if user is also a patient
        const changedInPatient = ["gender", "dateOfBirth", "cccd", "avatar", "employeeCode"].some(f => employee.changed(f as any));
        if (changedInPatient) {
          await sequelize.models.Patient.update({
            patientCode: employee.employeeCode,
            gender: employee.gender,
            dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : undefined,
            cccd: employee.cccd,
            avatar: employee.avatar
          }, { 
            where: { userId }, 
            hooks: false 
          } as any);
        }

        // Sync phone/address to PatientProfile if applicable
        if (employee.changed("phone") || employee.changed("address")) {
          const patient = await sequelize.models.Patient.findOne({ where: { userId } });
          if (patient) {
            if (employee.changed("phone") && employee.phone) {
              await sequelize.models.PatientProfile.upsert({
                patientId: (patient as any).id,
                type: 'phone',
                value: employee.phone,
                isPrimary: true
              }, { hooks: false } as any);
            }
            if (employee.changed("address") && employee.address) {
              await sequelize.models.PatientProfile.upsert({
                patientId: (patient as any).id,
                type: 'address',
                value: employee.address,
                isPrimary: true
              }, { hooks: false } as any);
            }
          }
        }
      }
    }
  }
);

export default Employee;
