'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add isActive to doctors if not exists
    const tableInfo = await queryInterface.describeTable('doctors');
    if (!tableInfo.isActive) {
      await queryInterface.addColumn('doctors', 'isActive', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }

    // Ensure isActive exists in patients (it should already, but being safe)
    const patientTableInfo = await queryInterface.describeTable('patients');
    if (!patientTableInfo.isActive) {
      await queryInterface.addColumn('patients', 'isActive', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }

    // Ensure isActive exists in employees
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
    // We don't necessarily want to remove columns in down if they were already there, 
    // but for the columns we added specifically:
    await queryInterface.removeColumn('doctors', 'isActive');
  }
};
