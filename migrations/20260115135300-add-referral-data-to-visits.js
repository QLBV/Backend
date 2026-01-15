'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('visits', 'referralData', { 
      type: Sequelize.JSON, 
      allowNull: true,
      comment: 'Stores referral history: [{fromDoctorId, toDoctorId, reason, ...}]'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('visits', 'referralData');
  }
};
