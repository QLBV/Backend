'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW')
      DEFAULT 'WAITING'
    `);
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM('WAITING', 'CANCELLED', 'CHECKED_IN')
      DEFAULT 'WAITING'
    `);
  },
};
