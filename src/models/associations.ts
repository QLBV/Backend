// Model associations setup
// Import all models
import Prescription from "./Prescription";
import PrescriptionDetail from "./PrescriptionDetail";
import Medicine from "./Medicine";
import Visit from "./Visit";
import Doctor from "./Doctor";
import Patient from "./Patient";
import DiseaseCategory from "./DiseaseCategory";

/**
 * Setup all model associations
 * This function should be called after all models are initialized
 */
export const setupAssociations = () => {
  // Prescription associations
  Prescription.belongsTo(Visit, { foreignKey: "visitId" });
  Prescription.belongsTo(Doctor, { foreignKey: "doctorId" });
  Prescription.belongsTo(Patient, { foreignKey: "patientId" });
  Prescription.hasMany(PrescriptionDetail, {
    foreignKey: "prescriptionId",
    as: "details",
  });

  // PrescriptionDetail associations
  PrescriptionDetail.belongsTo(Prescription, {
    foreignKey: "prescriptionId",
  });
  PrescriptionDetail.belongsTo(Medicine, { foreignKey: "medicineId" });

  // Visit associations (additional to existing ones)
  Visit.belongsTo(DiseaseCategory, { foreignKey: "diseaseCategoryId" });
  Visit.hasOne(Prescription, { foreignKey: "visitId" });
};
