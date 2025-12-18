import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Patient from "./Patient";

interface VisitAttributes {
  id: number;
  visitCode: string;
  patientId: number;
  visitDate: Date;
  symptomInitial: string;
  status: "waiting" | "examining" | "done";
}

interface VisitCreationAttributes
  extends Optional<VisitAttributes, "id" | "visitCode" | "status"> {}

class Visit
  extends Model<VisitAttributes, VisitCreationAttributes>
  implements VisitAttributes
{
  public id!: number;
  public visitCode!: string;
  public patientId!: number;
  public visitDate!: Date;
  public symptomInitial!: string;
  public status!: "waiting" | "examining" | "done";
}
Visit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    visitCode: {
      type: DataTypes.STRING,
    },
    patientId: {
      type: DataTypes.INTEGER,
    },
    visitDate: {
      type: DataTypes.DATEONLY,
    },
    symptomInitial: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM("waiting", "examining", "done"),
    },
  },
  {
    sequelize,
    tableName: "visits",
    timestamps: true,
    underscored: true,
  }
);
Visit.belongsTo(Patient, { foreignKey: "patientId" });
Patient.hasMany(Visit, { foreignKey: "patientId" });

export default Visit;
