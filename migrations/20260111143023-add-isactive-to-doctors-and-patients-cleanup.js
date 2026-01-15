'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    
    const tableInfo = await queryInterface.describeTable('doctors');
    if (!tableInfo.isActive) {
      await queryInterface.addColumn('doctors', 'isActive', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }

    
    const patientTableInfo = await queryInterface.describeTable('patients');
    if (!patientTableInfo.isActive) {
      await queryInterface.addColumn('patients', 'isActive', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }

    
    const employeeTableInfo = await queryInterface.describeTable('employees');
    if (!employeeTableInfo.isActive) {
      await queryInterface.addColumn('employees', 'isActive', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    
    
    await queryInterface.removeColumn('doctors', 'isActive');
  }
};
