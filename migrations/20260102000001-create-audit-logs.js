'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who performed the action (NULL for system actions)',
      },
      action: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT'),
        allowNull: false,
      },
      tableName: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Name of the affected table',
      },
      recordId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'ID of the affected record',
      },
      oldValue: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Previous state (for UPDATE/DELETE)',
      },
      newValue: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'New state (for CREATE/UPDATE)',
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IPv4 or IPv6 address',
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Browser/client information',
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    
    await queryInterface.addIndex('audit_logs', ['userId'], {
      name: 'idx_audit_user',
    });

    await queryInterface.addIndex('audit_logs', ['tableName', 'recordId'], {
      name: 'idx_audit_table_record',
    });

    await queryInterface.addIndex('audit_logs', ['timestamp'], {
      name: 'idx_audit_timestamp',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};
