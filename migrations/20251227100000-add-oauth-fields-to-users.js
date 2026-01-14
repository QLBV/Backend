'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'oauth2Provider', {
      type: Sequelize.ENUM('GOOGLE'),
      allowNull: true,
      comment: 'OAuth2 provider (Google)',
    });

    await queryInterface.addColumn('users', 'oauth2Id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'OAuth2 provider user ID',
    });

    await queryInterface.addColumn('users', 'userCode', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'User code (BN000xxx, BS000xxx, NV000xxx)',
    });

    // Make password nullable for OAuth users
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // Add index for OAuth lookup
    await queryInterface.addIndex('users', ['oauth2Provider', 'oauth2Id'], {
      name: 'idx_users_oauth',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_oauth');
    await queryInterface.removeColumn('users', 'userCode');
    await queryInterface.removeColumn('users', 'oauth2Id');
    await queryInterface.removeColumn('users', 'oauth2Provider');

    // Revert password to NOT NULL
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};