'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      const [columns] = await queryInterface.sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME = '${columnName}'
      `);
      return columns.length > 0;
    };

    if (!(await columnExists('patients', 'bloodType'))) {
      await queryInterface.addColumn('patients', 'bloodType', {
        type: Sequelize.ENUM('A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: true,
        comment: 'Nhóm máu của bệnh nhân'
      });
    }

    if (!(await columnExists('patients', 'height'))) {
      await queryInterface.addColumn('patients', 'height', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Chiều cao (cm)'
      });
    }

    if (!(await columnExists('patients', 'weight'))) {
      await queryInterface.addColumn('patients', 'weight', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Cân nặng (kg)'
      });
    }

    if (!(await columnExists('patients', 'chronicDiseases'))) {
      await queryInterface.addColumn('patients', 'chronicDiseases', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Danh sách bệnh lý mãn tính'
      });
    }

    if (!(await columnExists('patients', 'allergies'))) {
      await queryInterface.addColumn('patients', 'allergies', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Danh sách dị ứng'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('patients', 'bloodType');
    await queryInterface.removeColumn('patients', 'height');
    await queryInterface.removeColumn('patients', 'weight');
    await queryInterface.removeColumn('patients', 'chronicDiseases');
    await queryInterface.removeColumn('patients', 'allergies');
  }
};
