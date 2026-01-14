"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Alter the enum column to add SYSTEM type
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      MODIFY COLUMN type ENUM('APPOINTMENT_CREATED', 'APPOINTMENT_CANCELLED', 'DOCTOR_CHANGED', 'SYSTEM')
      NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to original enum values
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
      MODIFY COLUMN type ENUM('APPOINTMENT_CREATED', 'APPOINTMENT_CANCELLED', 'DOCTOR_CHANGED')
      NOT NULL;
    `);
  },
};
