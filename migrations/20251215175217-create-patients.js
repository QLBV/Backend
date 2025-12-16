"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("patients", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      patientCode: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },

      fullName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      gender: {
        type: Sequelize.ENUM("male", "female", "other"),
        allowNull: true,
      },

      dob: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("patients");
  },
};
