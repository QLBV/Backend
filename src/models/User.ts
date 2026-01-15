import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Role from "./Role";

interface UserAttributes {
  id: number;
  email: string;
  password: string;
  fullName: string;
  roleId: number;
  isActive: boolean;
  avatar?: string;
  oauth2Provider?: "GOOGLE";
  oauth2Id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  isEmailVerified?: boolean;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "isActive" | "password"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public password!: string;
  public fullName!: string;
  public roleId!: number;
  public isActive!: boolean;
  public avatar?: string;
  public oauth2Provider?: "GOOGLE";
  public oauth2Id?: string;
  public passwordResetToken?: string | null;
  public passwordResetExpires?: Date | null;
  public emailVerificationToken?: string | null;
  public emailVerificationExpires?: Date | null;
  public isEmailVerified?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public Role?: {
    name: string;
  };
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true, 
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    oauth2Provider: {
      type: DataTypes.ENUM("GOOGLE"),
      allowNull: true,
    },
    oauth2Id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    hooks: {
      afterUpdate: async (user: User, options: any) => {
        if (options.syncing) return;
        
        const updates: any = {};
        if (user.changed("avatar")) updates.avatar = user.avatar;
        if (user.changed("isActive")) updates.isActive = user.isActive;

        if (Object.keys(updates).length > 0) {
          const Employee = sequelize.models.Employee;
          if (Employee) {
            await Employee.update(updates, { where: { userId: user.id }, hooks: false } as any);
          }
          const Patient = sequelize.models.Patient;
          if (Patient) {
            await Patient.update(updates, { where: { userId: user.id }, hooks: false } as any);
          }
          
          if (user.changed("isActive")) {
            const Doctor = sequelize.models.Doctor;
            if (Doctor) {
              await Doctor.update({ isActive: user.isActive }, { where: { userId: user.id }, hooks: false } as any);
            }
          }
        }
      }
    }
  }
);

export default User;
