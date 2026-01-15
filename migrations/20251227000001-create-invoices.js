'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      invoiceCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã hóa đơn dạng INV-YYYYMMDD-00001'
      },
      visitId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'visits',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK to visits - Mỗi visit chỉ có 1 invoice'
      },
      patientId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK to patients'
      },
      doctorId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK to doctors'
      },

      
      examinationFee: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Phí khám bệnh (VNĐ)'
      },
      medicineTotalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng tiền thuốc (VNĐ)'
      },
      discount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Giảm giá (VNĐ)'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng tiền = examinationFee + medicineTotalAmount - discount'
      },

      
      paymentStatus: {
        type: Sequelize.ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID'),
        allowNull: false,
        defaultValue: 'UNPAID',
        comment: 'Trạng thái thanh toán'
      },
      paidAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Số tiền đã thanh toán'
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
        comment: 'FK to users - Người tạo hóa đơn (Admin/Receptionist)'
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

    
    await queryInterface.addIndex('invoices', ['invoiceCode'], {
      name: 'idx_invoices_code'
    });
    await queryInterface.addIndex('invoices', ['visitId'], {
      name: 'idx_invoices_visit'
    });
    await queryInterface.addIndex('invoices', ['patientId'], {
      name: 'idx_invoices_patient'
    });
    await queryInterface.addIndex('invoices', ['doctorId'], {
      name: 'idx_invoices_doctor'
    });
    await queryInterface.addIndex('invoices', ['paymentStatus'], {
      name: 'idx_invoices_payment_status'
    });
    await queryInterface.addIndex('invoices', ['createdAt'], {
      name: 'idx_invoices_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoices');
  }
};
