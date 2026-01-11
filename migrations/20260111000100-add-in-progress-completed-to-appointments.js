"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Expand appointment status to support doctor workflow (in-progress / completed)
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')
      DEFAULT 'WAITING'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert to previous enum set
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING','CHECKED_IN','CANCELLED','NO_SHOW')
      DEFAULT 'WAITING'
    `);
  },
};
