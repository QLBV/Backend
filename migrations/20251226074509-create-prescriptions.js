'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prescriptions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      prescriptionCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã đơn thuốc (RX-YYYYMMDD-00001)',
      },
      visitId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        comment: 'ID phiếu khám (1 visit chỉ có 1 đơn thuốc)',
        references: {
          model: 'visits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      doctorId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Bác sĩ kê đơn',
        references: {
          model: 'doctors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      patientId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Bệnh nhân',
        references: {
          model: 'patients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng tiền đơn thuốc',
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'LOCKED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'DRAFT',
        comment: 'DRAFT: Có thể sửa, LOCKED: Đã thanh toán (không sửa được), CANCELLED: Đã hủy',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú của bác sĩ',
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

    
    await queryInterface.addIndex('prescriptions', ['prescriptionCode'], {
      name: 'idx_prescriptions_code',
      unique: true,
    });
    await queryInterface.addIndex('prescriptions', ['visitId'], {
      name: 'idx_prescriptions_visit',
      unique: true,
    });
    await queryInterface.addIndex('prescriptions', ['doctorId'], {
      name: 'idx_prescriptions_doctor',
    });
    await queryInterface.addIndex('prescriptions', ['patientId'], {
      name: 'idx_prescriptions_patient',
    });
    await queryInterface.addIndex('prescriptions', ['status'], {
      name: 'idx_prescriptions_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prescriptions');
  },
};
