"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("patient_addresses", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      patient_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "patients",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      address_line: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ward: Sequelize.STRING(100),
      city: Sequelize.STRING(100),
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("patient_addresses");
  },
};
