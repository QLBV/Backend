import sequelize from "../config/database";
import User from "./User";
import Role from "./Role";
import Permission from "./Permission";
import RolePermission from "./RolePermission";
import Patient from "./Patient";
import PatientContact from "./PatientContact";

export { sequelize, User, Role, Permission, RolePermission };

Patient.hasMany(PatientContact, { foreignKey: "patientId" });
PatientContact.belongsTo(Patient, { foreignKey: "patientId" });

export { Patient, PatientContact };
