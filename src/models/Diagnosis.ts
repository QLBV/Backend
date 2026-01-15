import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "./index";

export enum DiagnosisSeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  CRITICAL = "CRITICAL",
}

interface DiagnosisAttributes {
  id: number;
  visitId: number;
  diseaseCategoryId: number;
  diagnosisDetail: string;
  icd10Code?: string;
  severity?: DiagnosisSeverity;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DiagnosisCreationAttributes
  extends Optional<
    DiagnosisAttributes,
    "id" | "icd10Code" | "severity" | "note"
  > {}

class Diagnosis
  extends Model<DiagnosisAttributes, DiagnosisCreationAttributes>
  implements DiagnosisAttributes
{
  public id!: number;
  public visitId!: number;
  public diseaseCategoryId!: number;
  public diagnosisDetail!: string;
  public icd10Code?: string;
  public severity?: DiagnosisSeverity;
  public note?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  
  public readonly visit?: any;
  public readonly diseaseCategory?: any;
}

Diagnosis.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    visitId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "visits",
        key: "id",
      },
      comment: "Visit this diagnosis belongs to",
    },
    diseaseCategoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "disease_categories",
        key: "id",
      },
      comment: "Disease category",
    },
    diagnosisDetail: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Detailed diagnosis description",
    },
    icd10Code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "ICD-10 disease code (WHO standard)",
    },
    severity: {
      type: DataTypes.ENUM(...Object.values(DiagnosisSeverity)),
      allowNull: true,
      comment: "Severity level of the diagnosis",
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional notes",
    },
  },
  {
    sequelize,
    tableName: "diagnoses",
    timestamps: true,
    indexes: [
      {
        name: "idx_diagnosis_visit",
        fields: ["visitId"],
      },
      {
        name: "idx_diagnosis_category",
        fields: ["diseaseCategoryId"],
      },
      {
        name: "idx_diagnosis_icd10",
        fields: ["icd10Code"],
      },
    ],
  }
);

export default Diagnosis;
