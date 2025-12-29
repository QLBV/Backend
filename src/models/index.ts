import sequelize from "../config/database";

import User from "./User";
import Role from "./Role";
import Permission from "./Permission";
import RolePermission from "./RolePermission";

import Patient from "./Patient";
import PatientProfile from "./PatientProfile";

import Medicine from "./Medicine";
import MedicineImport from "./MedicineImport";
import MedicineExport from "./MedicineExport";

import DiseaseCategory from "./DiseaseCategory";
import Visit from "./Visit";

import Prescription from "./Prescription";
import PrescriptionDetail from "./PrescriptionDetail";

// Setup associations after all models are loaded
import { setupAssociations } from "./associations";
setupAssociations();

export {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  Patient,
  PatientProfile,
  Medicine,
  MedicineImport,
  MedicineExport,
  DiseaseCategory,
  Visit,
  Prescription,
  PrescriptionDetail,
};
