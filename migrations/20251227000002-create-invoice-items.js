'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoice_items', {
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
        onDelete: 'CASCADE',
        comment: 'FK to invoices'
      },
      itemType: {
        type: Sequelize.ENUM('EXAMINATION', 'MEDICINE'),
        allowNull: false,
        comment: 'Loại item: EXAMINATION (khám bệnh) hoặc MEDICINE (thuốc)'
      },

      // For EXAMINATION
      description: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Mô tả cho khám bệnh, ví dụ: "Khám Tim mạch"'
      },

      // For MEDICINE
      prescriptionDetailId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'prescription_details',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'FK to prescription_details (nếu là thuốc)'
      },
      medicineName: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Snapshot tên thuốc tại thời điểm tạo hóa đơn'
      },
      medicineCode: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Snapshot mã thuốc tại thời điểm tạo hóa đơn'
      },

      // Pricing
      quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        comment: 'Số lượng (1 cho khám bệnh, N cho thuốc)'
      },
      unitPrice: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Đơn giá (VNĐ)'
      },
      subtotal: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Thành tiền = quantity × unitPrice'
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
    await queryInterface.addIndex('invoice_items', ['invoiceId'], {
      name: 'idx_invoice_items_invoice'
    });
    await queryInterface.addIndex('invoice_items', ['itemType'], {
      name: 'idx_invoice_items_type'
    });
    await queryInterface.addIndex('invoice_items', ['prescriptionDetailId'], {
      name: 'idx_invoice_items_prescription_detail'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoice_items');
  }
};
