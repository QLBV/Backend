'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refunds', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      invoiceId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Refund amount (must be positive)',
      },
      reason: {
        type: Sequelize.ENUM('APPOINTMENT_CANCELLED', 'MEDICINE_RETURNED', 'OVERCHARGED', 'DUPLICATE_PAYMENT', 'OTHER'),
        allowNull: false,
      },
      reasonDetail: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed explanation of refund reason',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      requestedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who requested the refund',
      },
      approvedBy: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who approved/rejected the refund',
      },
      requestDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      approvedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    
    await queryInterface.addIndex('refunds', ['invoiceId'], {
      name: 'idx_refund_invoice',
    });

    await queryInterface.addIndex('refunds', ['status'], {
      name: 'idx_refund_status',
    });

    await queryInterface.addIndex('refunds', ['requestedBy'], {
      name: 'idx_refund_requested_by',
    });

    
    await queryInterface.sequelize.query(`
      ALTER TABLE refunds ADD CONSTRAINT chk_refund_amount_positive CHECK (amount > 0);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('refunds');
  }
};
