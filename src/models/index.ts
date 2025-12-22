import sequelize from "../config/database";

import User from "./User";
import Role from "./Role";
import Permission from "./Permission";
import RolePermission from "./RolePermission";

import Patient from "./Patient";
import PatientProfile from "./PatientProfile";

export {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  Patient,
  PatientProfile,
};
