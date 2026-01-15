'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('prescription_details', 'days', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('prescription_details', 'days');
  }
};
