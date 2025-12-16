import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface PatientContactAttributes {
  id: number;
  patientId: number;
  type: "email" | "phone";
  value: string;
  isPrimary: boolean;
}

interface PatientContactCreation
  extends Optional<PatientContactAttributes, "id" | "isPrimary"> {}

class PatientContact
  extends Model<PatientContactAttributes, PatientContactCreation>
  implements PatientContactAttributes
{
  public id!: number;
  public patientId!: number;
  public type!: "email" | "phone";
  public value!: string;
  public isPrimary!: boolean;
}

PatientContact.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("email", "phone"),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "patient_contacts",
    timestamps: true,
  }
);

export default PatientContact;
