"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1️⃣ add is_active
    await queryInterface.addColumn("patients", "is_active", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // 2️⃣ rename patientCode → patient_code (chuẩn DB)
    await queryInterface.renameColumn(
      "patients",
      "patientCode",
      "patient_code"
    );

    // 3️⃣ rename userId → user_id (chuẩn DB)
    await queryInterface.renameColumn("patients", "userId", "user_id");
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("patients", "is_active");
    await queryInterface.renameColumn(
      "patients",
      "patient_code",
      "patientCode"
    );
    await queryInterface.renameColumn("patients", "user_id", "userId");
  },
};
