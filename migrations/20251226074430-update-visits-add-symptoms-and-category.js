'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add symptoms column
    await queryInterface.addColumn('visits', 'symptoms', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Triệu chứng của bệnh nhân',
    });

    // Add diseaseCategoryId column with foreign key
    await queryInterface.addColumn('visits', 'diseaseCategoryId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'ID loại bệnh',
      references: {
        model: 'disease_categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add index on diseaseCategoryId
    await queryInterface.addIndex('visits', ['diseaseCategoryId'], {
      name: 'idx_visits_disease_category',
    });
  },

  async down(queryInterface) {
    // Remove index first
    await queryInterface.removeIndex('visits', 'idx_visits_disease_category');

    // Remove columns
    await queryInterface.removeColumn('visits', 'diseaseCategoryId');
    await queryInterface.removeColumn('visits', 'symptoms');
  },
};
