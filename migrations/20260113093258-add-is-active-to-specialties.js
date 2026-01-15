'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('specialties', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('specialties', 'isActive');
  }
};
