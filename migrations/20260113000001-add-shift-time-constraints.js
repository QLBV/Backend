/**
 * Migration: Add CHECK constraint to shifts table
 * Purpose: Ensure startTime < endTime at database level
 * This prevents invalid shifts that cross midnight or have endTime before startTime
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add CHECK constraint: startTime < endTime
    // This ensures shifts have valid time ranges
    // Note: MySQL doesn't support named CHECK constraints in all versions,
    // so we use ALTER TABLE ADD CONSTRAINT syntax
    await queryInterface.sequelize.query(`
      ALTER TABLE shifts
      ADD CONSTRAINT check_shift_time_valid
      CHECK (startTime < endTime)
    `);

    console.log('✅ Added CHECK constraint: shifts.startTime < shifts.endTime');
  },

  async down(queryInterface, Sequelize) {
    // Remove the CHECK constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE shifts
      DROP CONSTRAINT check_shift_time_valid
    `);

    console.log('✅ Removed CHECK constraint from shifts table');
  }
};
