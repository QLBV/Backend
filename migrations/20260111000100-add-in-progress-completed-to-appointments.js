"use strict";


module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')
      DEFAULT 'WAITING'
    `);
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING','CHECKED_IN','CANCELLED','NO_SHOW')
      DEFAULT 'WAITING'
    `);
  },
};
