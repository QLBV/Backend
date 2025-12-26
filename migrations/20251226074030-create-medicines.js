'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medicines', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      medicineCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã thuốc (MED-000001)',
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Tên thuốc',
      },
      group: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nhóm thuốc (Kháng sinh, Giảm đau, v.v.)',
      },
      activeIngredient: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Hoạt chất',
      },
      manufacturer: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Nhà sản xuất',
      },
      unit: {
        type: Sequelize.ENUM('VIEN', 'ML', 'HOP', 'CHAI', 'TUYP', 'GOI'),
        allowNull: false,
        defaultValue: 'VIEN',
        comment: 'Đơn vị tính',
      },
      importPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Giá nhập',
      },
      salePrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Giá bán',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số lượng tồn kho',
      },
      minStockLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
        comment: 'Mức tồn kho tối thiểu',
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Ngày hết hạn',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả, hướng dẫn sử dụng',
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'REMOVED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        comment: 'Trạng thái thuốc',
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
    await queryInterface.addIndex('medicines', ['medicineCode'], {
      name: 'idx_medicines_code',
      unique: true,
    });
    await queryInterface.addIndex('medicines', ['status'], {
      name: 'idx_medicines_status',
    });
    await queryInterface.addIndex('medicines', ['quantity'], {
      name: 'idx_medicines_quantity',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('medicines');
  },
};
