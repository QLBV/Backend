'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payrolls', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      payrollCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã phiếu lương dạng PAY-YYYYMM-00001'
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'FK to users - Nhân viên nhận lương'
      },

      // Period
      month: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Tháng (1-12)'
      },
      year: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        comment: 'Năm (YYYY)'
      },

      // Salary Components (Snapshot tại thời điểm tính lương)
      baseSalary: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 2500000,
        comment: 'Lương cơ sở (VNĐ) - mặc định 2,500,000'
      },
      roleCoefficient: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Hệ số role (2.0 cho Lễ tân, 3.0 cho Admin, 5.0 cho Bác sĩ)'
      },
      roleSalary: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Lương theo role = baseSalary × roleCoefficient'
      },
      yearsOfService: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số năm làm việc'
      },
      experienceBonus: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Phụ cấp kinh nghiệm = yearsOfService × 200,000'
      },

      // Commission (Chỉ cho Doctor)
      totalInvoices: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng hóa đơn đã thanh toán trong tháng (VNĐ)'
      },
      commissionRate: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.05,
        comment: 'Tỷ lệ hoa hồng (0.05 = 5%)'
      },
      commission: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Hoa hồng = totalInvoices × commissionRate'
      },

      // Deductions
      daysOff: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số ngày nghỉ trong tháng'
      },
      allowedDaysOff: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 2,
        comment: 'Số ngày phép được phép (mặc định 2 ngày/tháng)'
      },
      penaltyDaysOff: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số ngày nghỉ quá phép = MAX(0, daysOff - allowedDaysOff)'
      },
      penaltyAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Số tiền phạt = penaltyDaysOff × 200,000'
      },

      // Total
      grossSalary: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Tổng thu nhập = roleSalary + experienceBonus + commission'
      },
      netSalary: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Thực lĩnh = grossSalary - penaltyAmount'
      },

      // Status
      status: {
        type: Sequelize.ENUM('DRAFT', 'APPROVED', 'PAID'),
        allowNull: false,
        defaultValue: 'DRAFT',
        comment: 'Trạng thái: DRAFT (Đang tính), APPROVED (Đã duyệt), PAID (Đã thanh toán)'
      },
      approvedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'FK to users - Admin duyệt lương'
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian duyệt'
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian thanh toán'
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

    // Add unique constraint: Mỗi user chỉ có 1 payroll/tháng
    await queryInterface.addConstraint('payrolls', {
      fields: ['userId', 'month', 'year'],
      type: 'unique',
      name: 'unique_user_month_year'
    });

    // Add indexes
    await queryInterface.addIndex('payrolls', ['payrollCode'], {
      name: 'idx_payrolls_code'
    });
    await queryInterface.addIndex('payrolls', ['userId'], {
      name: 'idx_payrolls_user'
    });
    await queryInterface.addIndex('payrolls', ['month', 'year'], {
      name: 'idx_payrolls_period'
    });
    await queryInterface.addIndex('payrolls', ['status'], {
      name: 'idx_payrolls_status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payrolls');
  }
};
