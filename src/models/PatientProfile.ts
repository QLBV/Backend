import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface PatientProfileAttributes {
  id: number;
  patientId: number;
  type: "email" | "phone" | "address";
  value: string;
  ward?: string;
  city?: string;
  isPrimary: boolean;
}

interface PatientProfileCreation
  extends Optional<PatientProfileAttributes, "id" | "isPrimary"> {}

class PatientProfile
  extends Model<PatientProfileAttributes, PatientProfileCreation>
  implements PatientProfileAttributes
{
  public id!: number;
  public patientId!: number;
  public type!: "email" | "phone" | "address";
  public value!: string;
  public ward?: string;
  public city?: string;
  public isPrimary!: boolean;
}

PatientProfile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "patient_id",
    },
    type: {
      type: DataTypes.ENUM("email", "phone", "address"),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ward: DataTypes.STRING(100),
    city: DataTypes.STRING(100),
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_primary",
    },
  },
  {
    sequelize,
    tableName: "patient_profiles",
    timestamps: true,
    underscored: true,
    hooks: {
      afterUpdate: async (profile: PatientProfile, options: any) => {
        if (options.syncing) return;
        if (profile.type === 'phone' || profile.type === 'address') {
          const Patient = sequelize.models.Patient;
          const patient: any = await Patient.findByPk(profile.patientId);
          if (patient && patient.userId) {
            const Employee = sequelize.models.Employee;
            if (Employee) {
              const field = profile.type === 'phone' ? 'phone' : 'address';
              await Employee.update({ [field]: profile.value }, { where: { userId: patient.userId }, hooks: false } as any);
            }
          }
        }
      },
      afterCreate: async (profile: PatientProfile, options: any) => {
        if (options.syncing) return;
        if (profile.type === 'phone' || profile.type === 'address') {
          const Patient = sequelize.models.Patient;
          const patient: any = await Patient.findByPk(profile.patientId);
          if (patient && patient.userId) {
            const Employee = sequelize.models.Employee;
            if (Employee) {
              const field = profile.type === 'phone' ? 'phone' : 'address';
              await Employee.update({ [field]: profile.value }, { where: { userId: patient.userId }, hooks: false } as any);
            }
          }
        }
      }
    }
  }
);

export default PatientProfile;
