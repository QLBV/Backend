import sequelize from "../config/database";

import User from "./User";
import Role from "./Role";
import Permission from "./Permission";
import RolePermission from "./RolePermission";

import Patient from "./Patient";
import PatientProfile from "./PatientProfile";

// /* =======================
//    ASSOCIATIONS
// ======================= */

// // User - Role
// User.belongsTo(Role, { foreignKey: "roleId" });
// Role.hasMany(User, { foreignKey: "roleId" });

// // Role - Permission (many-to-many)
// Role.belongsToMany(Permission, {
//   through: RolePermission,
//   foreignKey: "roleId",
// });
// Permission.belongsToMany(Role, {
//   through: RolePermission,
//   foreignKey: "permissionId",
// });

// // Patient - PatientProfile
// Patient.hasMany(PatientProfile, {
//   foreignKey: "patientId",
//   as: "profiles",
// });
// PatientProfile.belongsTo(Patient, {
//   foreignKey: "patientId",
// });

/* =======================
   EXPORT
======================= */

export {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  Patient,
  PatientProfile,
};
