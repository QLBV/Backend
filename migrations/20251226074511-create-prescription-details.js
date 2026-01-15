'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prescription_details', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      prescriptionId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'ID đơn thuốc',
        references: {
          model: 'prescriptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      medicineName: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Tên thuốc (snapshot tại thời điểm kê đơn)',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Số lượng thuốc',
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Đơn vị (snapshot)',
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Giá bán tại thời điểm kê đơn',
      },
      dosageMorning: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Liều sáng',
      },
      dosageNoon: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Liều trưa',
      },
      dosageAfternoon: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Liều chiều',
      },
      dosageEvening: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Liều tối',
      },
      instruction: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Hướng dẫn sử dụng (uống trước/sau ăn, v.v.)',
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

    
    await queryInterface.addIndex('prescription_details', ['prescriptionId'], {
      name: 'idx_prescription_details_prescription',
    });
    await queryInterface.addIndex('prescription_details', ['medicineId'], {
      name: 'idx_prescription_details_medicine',
    });

    
    await queryInterface.addIndex(
      'prescription_details',
      ['prescriptionId', 'medicineId'],
      {
        name: 'idx_prescription_details_unique',
        unique: true,
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prescription_details');
  },
};
