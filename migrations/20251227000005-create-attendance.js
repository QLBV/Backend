'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'FK to users - Nhân viên'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ngày chấm công'
      },
      status: {
        type: Sequelize.ENUM('PRESENT', 'ABSENT', 'LEAVE', 'SICK_LEAVE'),
        allowNull: false,
        defaultValue: 'PRESENT',
        comment: 'Trạng thái: PRESENT (Có mặt), ABSENT (Vắng không phép), LEAVE (Nghỉ phép), SICK_LEAVE (Nghỉ ốm)'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú'
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

    
    await queryInterface.addConstraint('attendance', {
      fields: ['userId', 'date'],
      type: 'unique',
      name: 'unique_user_date'
    });

    
    await queryInterface.addIndex('attendance', ['userId'], {
      name: 'idx_attendance_user'
    });
    await queryInterface.addIndex('attendance', ['date'], {
      name: 'idx_attendance_date'
    });
    await queryInterface.addIndex('attendance', ['status'], {
      name: 'idx_attendance_status'
    });
    await queryInterface.addIndex('attendance', ['userId', 'date'], {
      name: 'idx_attendance_user_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attendance');
  }
};
