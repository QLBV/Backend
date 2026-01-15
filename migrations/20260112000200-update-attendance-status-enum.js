'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('attendance', 'status', {
      type: Sequelize.ENUM('PRESENT', 'ABSENT', 'LEAVE', 'SICK_LEAVE', 'LATE', 'EARLY_LEAVE', 'HALF_DAY'),
      allowNull: false,
      defaultValue: 'PRESENT'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('attendance', 'status', {
      type: Sequelize.ENUM('PRESENT', 'ABSENT', 'LEAVE', 'SICK_LEAVE'),
      allowNull: false,
      defaultValue: 'PRESENT'
    });
  }
};
