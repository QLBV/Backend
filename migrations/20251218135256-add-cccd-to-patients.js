"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("patients", "cccd", {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true,
      after: "gender",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("patients", "cccd");
  },
};
