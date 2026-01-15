'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.addColumn('visits', 'symptoms', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Triệu chứng của bệnh nhân',
    });

    
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

    
    await queryInterface.addIndex('visits', ['diseaseCategoryId'], {
      name: 'idx_visits_disease_category',
    });
  },

  async down(queryInterface) {
    
    await queryInterface.removeIndex('visits', 'idx_visits_disease_category');

    
    await queryInterface.removeColumn('visits', 'diseaseCategoryId');
    await queryInterface.removeColumn('visits', 'symptoms');
  },
};
