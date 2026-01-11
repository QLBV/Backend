'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('visits', 'doctorSignature', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Digital signature or hash of doctor\'s approval (for compliance)',
    });

    await queryInterface.addColumn('visits', 'signedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when doctor signed the diagnosis',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('visits', 'doctorSignature');
    await queryInterface.removeColumn('visits', 'signedAt');
  }
};
