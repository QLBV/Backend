'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicine_imports', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      medicineId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'ID thuốc',
        references: {
          model: 'medicines',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Số lượng nhập',
      },
      importPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Giá nhập',
      },
      importDate: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Ngày nhập kho',
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Người thực hiện nhập kho',
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    
    await queryInterface.addIndex('medicine_imports', ['medicineId'], {
      name: 'idx_medicine_imports_medicine',
    });
    await queryInterface.addIndex('medicine_imports', ['userId'], {
      name: 'idx_medicine_imports_user',
    });
    await queryInterface.addIndex('medicine_imports', ['importDate'], {
      name: 'idx_medicine_imports_date',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('medicine_imports');
  },
};
