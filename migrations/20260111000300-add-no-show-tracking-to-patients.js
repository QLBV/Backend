'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('patients', 'noShowCount', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of times patient missed appointments without notice',
    });

    await queryInterface.addColumn('patients', 'lastNoShowDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of most recent no-show incident',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('patients', 'noShowCount');
    await queryInterface.removeColumn('patients', 'lastNoShowDate');
  }
};
