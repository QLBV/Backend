"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Modify the column to include 'WAITING' and set default to 'WAITING'
      // Note: Changing ENUM in MySQL behaves like text, but good to be explicit.
      // We will replace the entire Enum definition.
      await queryInterface.changeColumn(
        "visits",
        "status",
        {
          type: Sequelize.ENUM("WAITING", "EXAMINING", "EXAMINED", "COMPLETED"),
          allowNull: false,
          defaultValue: "WAITING",
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Revert back to original ENUM and default
      // Note: This might fail if there are 'WAITING' records. 
      // Ideally we should map them back to EXAMINING or delete them.
      // For now, we just attempt to revert schema.
      await queryInterface.changeColumn(
        "visits",
        "status",
        {
          type: Sequelize.ENUM("EXAMINING", "EXAMINED", "COMPLETED"),
          allowNull: false,
          defaultValue: "EXAMINING",
        },
        { transaction }
      );
    });
  },
};
