import sequelize from "../config/database";

import User from "./User";
import Role from "./Role";
import Permission from "./Permission";
import RolePermission from "./RolePermission";

import Patient from "./Patient";
import PatientProfile from "./PatientProfile";

import Doctor from "./Doctor";
import Specialty from "./Specialty";
import Shift from "./Shift";
import ShiftTemplate from "./ShiftTemplate";
import DoctorShift from "./DoctorShift";
import Appointment from "./Appointment";

import Medicine from "./Medicine";
import MedicineImport from "./MedicineImport";
import MedicineExport from "./MedicineExport";

import DiseaseCategory from "./DiseaseCategory";
import Visit from "./Visit";

import Prescription from "./Prescription";
import PrescriptionDetail from "./PrescriptionDetail";

import Invoice from "./Invoice";
import InvoiceItem from "./InvoiceItem";
import Payment from "./Payment";

import Payroll from "./Payroll";
import Attendance from "./Attendance";

import Notification from "./Notification";
import NotificationSetting from "./NotificationSetting";

import AuditLog from "./AuditLog";
import Diagnosis from "./Diagnosis";
import Refund from "./Refund";

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
  Doctor,
  Specialty,
  Shift,
  ShiftTemplate,
  DoctorShift,
  Appointment,
  Medicine,
  MedicineImport,
  MedicineExport,
  DiseaseCategory,
  Visit,
  Prescription,
  PrescriptionDetail,
  Invoice,
  InvoiceItem,
  Payment,
  Payroll,
  Attendance,
  Notification,
  NotificationSetting,
  AuditLog,
  Diagnosis,
  Refund,
};
