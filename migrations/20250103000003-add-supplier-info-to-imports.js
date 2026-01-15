'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('medicine_imports', 'supplier', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Tên nhà cung cấp',
      after: 'userId',
    });

    await queryInterface.addColumn('medicine_imports', 'supplierInvoice', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Số hóa đơn nhà cung cấp',
      after: 'supplier',
    });

    await queryInterface.addColumn('medicine_imports', 'batchNumber', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Số lô thuốc',
      after: 'supplierInvoice',
    });

    await queryInterface.addColumn('medicine_imports', 'note', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Ghi chú',
      after: 'batchNumber',
    });

    await queryInterface.addColumn('medicine_exports', 'note', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Ghi chú',
      after: 'reason',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medicine_imports', 'supplier');
    await queryInterface.removeColumn('medicine_imports', 'supplierInvoice');
    await queryInterface.removeColumn('medicine_imports', 'batchNumber');
    await queryInterface.removeColumn('medicine_imports', 'note');
    await queryInterface.removeColumn('medicine_exports', 'note');
  },
};
