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
        type: Sequelize.STRING(10),
        unique: true,
      },
      fullName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM("MALE", "FEMALE", "OTHER"),
        allowNull: false,
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      cccd: {
        type: Sequelize.STRING(12),
        unique: true,
      },
      avatar: {
        type: Sequelize.STRING(255),
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("patients", ["patientCode"]);
    await queryInterface.addIndex("patients", ["cccd"]);
    await queryInterface.addIndex("patients", ["userId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("patients");
  },
};
