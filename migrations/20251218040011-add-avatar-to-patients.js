"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("patients", "avatar", {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: "gender",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("patients", "avatar");
  },
};
