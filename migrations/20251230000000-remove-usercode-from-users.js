'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'userCode');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'userCode', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'User code (BN000xxx, BS000xxx, NV000xxx)',
    });
  },
};
