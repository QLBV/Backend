'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE prescriptions
      MODIFY COLUMN status ENUM('DRAFT', 'LOCKED', 'DISPENSED', 'CANCELLED')
      DEFAULT 'DRAFT'
    `);

    
    await queryInterface.addColumn('prescriptions', 'dispensedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when prescription was dispensed',
    });

    
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
    
    await queryInterface.removeColumn('prescriptions', 'dispensedBy');
    await queryInterface.removeColumn('prescriptions', 'dispensedAt');

    
    await queryInterface.sequelize.query(`
      ALTER TABLE prescriptions
      MODIFY COLUMN status ENUM('DRAFT', 'LOCKED', 'CANCELLED')
      DEFAULT 'DRAFT'
    `);
  },
};