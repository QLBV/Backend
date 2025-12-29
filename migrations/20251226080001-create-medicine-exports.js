'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicine_exports', {
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
        comment: 'Số lượng xuất (audit trail)',
      },
      exportDate: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Ngày xuất kho',
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Người thực hiện xuất kho',
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Lý do xuất (PRESCRIPTION_RX-xxx, ADJUSTMENT, EXPIRED, v.v.)',
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
    await queryInterface.addIndex('medicine_exports', ['medicineId'], {
      name: 'idx_medicine_exports_medicine',
    });
    await queryInterface.addIndex('medicine_exports', ['userId'], {
      name: 'idx_medicine_exports_user',
    });
    await queryInterface.addIndex('medicine_exports', ['exportDate'], {
      name: 'idx_medicine_exports_date',
    });
    await queryInterface.addIndex('medicine_exports', ['reason'], {
      name: 'idx_medicine_exports_reason',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('medicine_exports');
  },
};
