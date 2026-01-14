'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL: Modify ENUM to add EXAMINED status
    await queryInterface.sequelize.query(`
      ALTER TABLE visits
      MODIFY COLUMN status ENUM('EXAMINING', 'EXAMINED', 'COMPLETED')
      DEFAULT 'EXAMINING';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Remove EXAMINED status
    await queryInterface.sequelize.query(`
      ALTER TABLE visits
      MODIFY COLUMN status ENUM('EXAMINING', 'COMPLETED')
      DEFAULT 'EXAMINING';
    `);
  }
};
