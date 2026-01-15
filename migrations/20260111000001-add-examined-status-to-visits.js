'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE visits
      MODIFY COLUMN status ENUM('EXAMINING', 'EXAMINED', 'COMPLETED')
      DEFAULT 'EXAMINING';
    `);
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE visits
      MODIFY COLUMN status ENUM('EXAMINING', 'COMPLETED')
      DEFAULT 'EXAMINING';
    `);
  }
};
