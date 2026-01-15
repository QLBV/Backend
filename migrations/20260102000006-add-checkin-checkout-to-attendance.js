'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attendance', 'checkInTime', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Check-in timestamp',
    });

    await queryInterface.addColumn('attendance', 'checkOutTime', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Check-out timestamp',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('attendance', 'checkOutTime');
    await queryInterface.removeColumn('attendance', 'checkInTime');
  },
};
