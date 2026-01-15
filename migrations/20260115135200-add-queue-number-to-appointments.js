'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('appointments', 'queueNumber', { 
      type: Sequelize.INTEGER, 
      allowNull: true 
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('appointments', 'queueNumber');
  }
};
