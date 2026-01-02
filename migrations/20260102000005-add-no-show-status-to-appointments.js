'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL requires ALTER to modify ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW')
      DEFAULT 'WAITING'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert to original ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING', 'CANCELLED', 'CHECKED_IN')
      DEFAULT 'WAITING'
    `);
  },
};
