'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('diagnoses', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      visitId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'visits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Visit this diagnosis belongs to',
      },
      diseaseCategoryId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'disease_categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Disease category',
      },
      diagnosisDetail: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Detailed diagnosis description',
      },
      icd10Code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'ICD-10 disease code (WHO standard)',
      },
      severity: {
        type: Sequelize.ENUM('MILD', 'MODERATE', 'SEVERE', 'CRITICAL'),
        allowNull: true,
        comment: 'Severity level of the diagnosis',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes',
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

    
    await queryInterface.addIndex('diagnoses', ['visitId'], {
      name: 'idx_diagnosis_visit',
    });

    await queryInterface.addIndex('diagnoses', ['diseaseCategoryId'], {
      name: 'idx_diagnosis_category',
    });

    await queryInterface.addIndex('diagnoses', ['icd10Code'], {
      name: 'idx_diagnosis_icd10',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('diagnoses');
  }
};
