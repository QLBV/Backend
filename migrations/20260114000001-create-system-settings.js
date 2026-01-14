'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      clinicName: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Tên phòng khám'
      },
      clinicAddress: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Địa chỉ phòng khám'
      },
      clinicPhone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Số điện thoại phòng khám'
      },
      clinicEmail: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Email phòng khám'
      },
      clinicWebsite: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Website phòng khám'
      },
      businessHours: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
          monday: { open: '08:00', close: '17:00', closed: false },
          tuesday: { open: '08:00', close: '17:00', closed: false },
          wednesday: { open: '08:00', close: '17:00', closed: false },
          thursday: { open: '08:00', close: '17:00', closed: false },
          friday: { open: '08:00', close: '17:00', closed: false },
          saturday: { open: '08:00', close: '12:00', closed: false },
          sunday: { open: '', close: '', closed: true }
        },
        comment: 'Giờ làm việc cho từng ngày trong tuần'
      },
      systemSettings: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
          maintenanceMode: false,
          allowOnlineBooking: true,
          allowOfflineBooking: true,
          maxAppointmentsPerDay: 50,
          appointmentDuration: 30,
          currency: 'VND',
          timezone: 'Asia/Ho_Chi_Minh'
        },
        comment: 'Cài đặt hệ thống (bảo trì, đặt lịch, tiền tệ, múi giờ)'
      },
      emailSettings: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: ''
        },
        comment: 'Cài đặt email SMTP'
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('system_settings');
  }
};
