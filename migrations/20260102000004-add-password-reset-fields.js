'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'passwordResetToken', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Hashed token for password reset',
    });

    await queryInterface.addColumn('users', 'passwordResetExpires', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Expiration time for password reset token',
    });

    
    await queryInterface.addIndex('users', ['passwordResetToken'], {
      name: 'idx_users_password_reset_token',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_password_reset_token');
    await queryInterface.removeColumn('users', 'passwordResetExpires');
    await queryInterface.removeColumn('users', 'passwordResetToken');
  },
};
