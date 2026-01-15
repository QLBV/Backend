

module.exports = {
  async up(queryInterface, Sequelize) {
    
    
    
    
    await queryInterface.sequelize.query(`
      ALTER TABLE shifts
      ADD CONSTRAINT check_shift_time_valid
      CHECK (startTime < endTime)
    `);

    console.log(' Added CHECK constraint: shifts.startTime < shifts.endTime');
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE shifts
      DROP CONSTRAINT check_shift_time_valid
    `);

    console.log(' Removed CHECK constraint from shifts table');
  }
};
