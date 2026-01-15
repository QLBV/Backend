'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID của user nhận thông báo',
      },
      type: {
        type: Sequelize.ENUM(
          'APPOINTMENT_CREATED',
          'APPOINTMENT_CANCELLED',
          'DOCTOR_CHANGED'
        ),
        allowNull: false,
        comment: 'Loại thông báo',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tiêu đề ngắn gọn',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Nội dung chi tiết',
      },
      relatedAppointmentId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'appointments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID lịch hẹn liên quan',
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Đã đọc chưa',
      },
      emailSent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Đã gửi email chưa',
      },
      emailSentAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian gửi email',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    
    await queryInterface.addIndex('notifications', ['userId', 'isRead']);
    await queryInterface.addIndex('notifications', ['userId', 'createdAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};
