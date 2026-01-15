"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      
      
      
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
