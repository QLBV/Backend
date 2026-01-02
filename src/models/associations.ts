// Model associations setup
// Import all models
import Prescription from "./Prescription";
import PrescriptionDetail from "./PrescriptionDetail";
import Medicine from "./Medicine";
import Visit from "./Visit";
import Doctor from "./Doctor";
import Patient from "./Patient";
import DiseaseCategory from "./DiseaseCategory";
import Invoice from "./Invoice";
import InvoiceItem from "./InvoiceItem";
import Payment from "./Payment";
import Payroll from "./Payroll";
import Attendance from "./Attendance";
import User from "./User";
import Appointment from "./Appointment";
import Shift from "./Shift";
import MedicineImport from "./MedicineImport";
import MedicineExport from "./MedicineExport";
import Role from "./Role";
import Permission from "./Permission";
import RolePermission from "./RolePermission";
import PatientProfile from "./PatientProfile";
import Specialty from "./Specialty";
import DoctorShift from "./DoctorShift";
import AuditLog from "./AuditLog";
import Diagnosis from "./Diagnosis";
import Refund from "./Refund";

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

  // Invoice associations
  Invoice.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });
  Invoice.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
  Invoice.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });
  Invoice.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
  Invoice.hasMany(InvoiceItem, { foreignKey: "invoiceId", as: "items" });
  Invoice.hasMany(Payment, { foreignKey: "invoiceId", as: "payments" });

  // InvoiceItem associations
  InvoiceItem.belongsTo(Invoice, { foreignKey: "invoiceId", as: "invoice" });
  InvoiceItem.belongsTo(PrescriptionDetail, {
    foreignKey: "prescriptionDetailId",
    as: "prescriptionDetail",
  });

  // Payment associations
  Payment.belongsTo(Invoice, { foreignKey: "invoiceId", as: "invoice" });
  Payment.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

  // Payroll associations
  Payroll.belongsTo(User, { foreignKey: "userId", as: "user" });
  Payroll.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });

  // Attendance associations
  Attendance.belongsTo(User, { foreignKey: "userId", as: "user" });

  // User associations (reverse)
  User.hasMany(Invoice, { foreignKey: "createdBy", as: "invoices" });
  User.hasMany(Payment, { foreignKey: "createdBy", as: "payments" });
  User.hasMany(Payroll, { foreignKey: "userId", as: "payrolls" });
  User.hasMany(Attendance, { foreignKey: "userId", as: "attendance" });

  // Visit associations (reverse)
  Visit.hasOne(Invoice, { foreignKey: "visitId", as: "invoice" });

  // Appointment associations
  Appointment.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
  Appointment.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });
  Appointment.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });

  // MedicineImport associations
  MedicineImport.belongsTo(Medicine, {
    foreignKey: "medicineId",
    as: "medicine",
  });
  MedicineImport.belongsTo(User, { foreignKey: "userId", as: "user" });

  // MedicineExport associations
  MedicineExport.belongsTo(Medicine, {
    foreignKey: "medicineId",
    as: "medicine",
  });
  MedicineExport.belongsTo(User, { foreignKey: "userId", as: "user" });

  // User <-> Role associations
  User.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  Role.hasMany(User, { foreignKey: "roleId", as: "users" });

  // Role <-> Permission associations (many-to-many)
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "roleId",
    as: "permissions",
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permissionId",
    as: "roles",
  });

  // Patient <-> PatientProfile associations
  Patient.hasMany(PatientProfile, {
    foreignKey: "patientId",
    as: "profiles",
  });
  PatientProfile.belongsTo(Patient, {
    foreignKey: "patientId",
    as: "patient",
  });

  // Patient <-> User association
  Patient.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // Doctor <-> User, Specialty associations
  Doctor.belongsTo(User, { foreignKey: "userId", as: "user" });
  Doctor.belongsTo(Specialty, { foreignKey: "specialtyId", as: "specialty" });

  // DoctorShift associations
  DoctorShift.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });
  DoctorShift.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });
  DoctorShift.belongsTo(Doctor, {
    foreignKey: "replacedBy",
    as: "replacementDoctor",
  });

  // Appointment associations (additional)
  Visit.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });
  Visit.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
  Visit.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });

  // AuditLog associations
  AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });

  // Diagnosis associations
  Diagnosis.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });
  Diagnosis.belongsTo(DiseaseCategory, {
    foreignKey: "diseaseCategoryId",
    as: "diseaseCategory",
  });
  Visit.hasMany(Diagnosis, { foreignKey: "visitId", as: "diagnoses" });
  DiseaseCategory.hasMany(Diagnosis, {
    foreignKey: "diseaseCategoryId",
    as: "diagnoses",
  });

  // Refund associations
  Refund.belongsTo(Invoice, { foreignKey: "invoiceId", as: "invoice" });
  Refund.belongsTo(User, { foreignKey: "requestedBy", as: "requester" });
  Refund.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });
  Invoice.hasMany(Refund, { foreignKey: "invoiceId", as: "refunds" });
  User.hasMany(Refund, { foreignKey: "requestedBy", as: "requestedRefunds" });
  User.hasMany(Refund, { foreignKey: "approvedBy", as: "approvedRefunds" });
};
