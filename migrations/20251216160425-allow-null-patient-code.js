"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("patients", "patient_code", {
      type: Sequelize.STRING(20),
      allowNull: true, // ✅ QUAN TRỌNG
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("patients", "patient_code", {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true,
    });
  },
};
