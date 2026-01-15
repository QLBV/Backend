'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_shifts', 'status', {
      type: Sequelize.ENUM('ACTIVE', 'CANCELLED', 'REPLACED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      comment: 'Trạng thái ca làm việc: ACTIVE (đang hoạt động), CANCELLED (đã hủy), REPLACED (đã được thay thế)'
    });

    await queryInterface.addColumn('doctor_shifts', 'replacedBy', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID của bác sĩ thay thế (nếu ca này bị hủy và có người thay)'
    });

    await queryInterface.addColumn('doctor_shifts', 'cancelReason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Lý do hủy ca làm việc'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('doctor_shifts', 'cancelReason');
    await queryInterface.removeColumn('doctor_shifts', 'replacedBy');
    await queryInterface.removeColumn('doctor_shifts', 'status');
  }
};
