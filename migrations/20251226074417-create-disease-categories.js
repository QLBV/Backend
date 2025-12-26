'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('disease_categories', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã loại bệnh (ICD-10 hoặc mã nội bộ)',
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Tên loại bệnh',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả chi tiết',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('disease_categories', ['code'], {
      name: 'idx_disease_categories_code',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('disease_categories');
  },
};
