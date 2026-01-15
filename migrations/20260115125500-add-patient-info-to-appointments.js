'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('appointments', 'patientName', { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addColumn('appointments', 'patientPhone', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('appointments', 'patientDob', { type: Sequelize.DATEONLY, allowNull: true });
    
    
    
    await queryInterface.addColumn('appointments', 'patientGender', { 
      type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: true 
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('appointments', 'patientName');
    await queryInterface.removeColumn('appointments', 'patientPhone');
    await queryInterface.removeColumn('appointments', 'patientDob');
    await queryInterface.removeColumn('appointments', 'patientGender');
  }
};
