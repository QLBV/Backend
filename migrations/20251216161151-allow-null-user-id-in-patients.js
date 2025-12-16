"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("patients", "user_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true, // ✅ QUAN TRỌNG
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("patients", "user_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    });
  },
};
