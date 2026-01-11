'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    await queryInterface.addColumn('employees', 'gender', {
      type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: true
    });
    await queryInterface.addColumn('employees', 'dateOfBirth', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.addColumn('employees', 'address', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('employees', 'cccd', {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'phone');
    await queryInterface.removeColumn('employees', 'gender');
    await queryInterface.removeColumn('employees', 'dateOfBirth');
    await queryInterface.removeColumn('employees', 'address');
    await queryInterface.removeColumn('employees', 'cccd');
  }
};
