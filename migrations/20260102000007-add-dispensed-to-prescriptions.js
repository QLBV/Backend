'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add DISPENSED to status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE prescriptions
      MODIFY COLUMN status ENUM('DRAFT', 'LOCKED', 'DISPENSED', 'CANCELLED')
      DEFAULT 'DRAFT'
    `);

    // Add dispensedAt column
    await queryInterface.addColumn('prescriptions', 'dispensedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when prescription was dispensed',
    });

    // Add dispensedBy column
    await queryInterface.addColumn('prescriptions', 'dispensedBy', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'User ID who dispensed the prescription',
      references: {
        model: 'users',
        key: 'id',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns
    await queryInterface.removeColumn('prescriptions', 'dispensedBy');
    await queryInterface.removeColumn('prescriptions', 'dispensedAt');

    // Revert ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE prescriptions
      MODIFY COLUMN status ENUM('DRAFT', 'LOCKED', 'CANCELLED')
      DEFAULT 'DRAFT'
    `);
  },
};