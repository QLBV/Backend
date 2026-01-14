'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      invoiceId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK to invoices'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Số tiền thanh toán (VNĐ)'
      },
      paymentMethod: {
        type: Sequelize.ENUM('CASH', 'BANK_TRANSFER', 'QR_CODE'),
        allowNull: false,
        comment: 'Phương thức thanh toán'
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Ngày thanh toán'
      },
      reference: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Mã giao dịch (cho chuyển khoản/QR code)'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú'
      },
      createdBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK to users - Người nhận tiền (Admin/Receptionist)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('payments', ['invoiceId'], {
      name: 'idx_payments_invoice'
    });
    await queryInterface.addIndex('payments', ['paymentMethod'], {
      name: 'idx_payments_method'
    });
    await queryInterface.addIndex('payments', ['paymentDate'], {
      name: 'idx_payments_date'
    });
    await queryInterface.addIndex('payments', ['createdBy'], {
      name: 'idx_payments_created_by'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
