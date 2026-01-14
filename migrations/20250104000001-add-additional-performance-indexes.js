'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if index exists
    const indexExists = async (tableName, indexName) => {
      const [indexes] = await queryInterface.sequelize.query(`
        SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}'
      `);
      return indexes.length > 0;
    };

    // Index for medicine search queries (name, medicineCode, activeIngredient)
    if (!(await indexExists('medicines', 'idx_medicines_name'))) {
      await queryInterface.addIndex('medicines', ['name'], {
        name: 'idx_medicines_name',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('medicines', 'idx_medicines_code'))) {
      await queryInterface.addIndex('medicines', ['medicineCode'], {
        name: 'idx_medicines_code',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('medicines', 'idx_medicines_group'))) {
      await queryInterface.addIndex('medicines', ['group'], {
        name: 'idx_medicines_group',
        using: 'BTREE',
      });
    }

    // Index for medicine quantity queries (low stock)
    if (!(await indexExists('medicines', 'idx_medicines_quantity'))) {
      await queryInterface.addIndex('medicines', ['quantity'], {
        name: 'idx_medicines_quantity',
        using: 'BTREE',
      });
    }

    // Composite index for user email lookups (OAuth)
    if (!(await indexExists('users', 'idx_users_email'))) {
      await queryInterface.addIndex('users', ['email'], {
        name: 'idx_users_email',
        using: 'BTREE',
      });
    }

    // Index for OAuth provider lookups
    if (!(await indexExists('users', 'idx_users_oauth'))) {
      await queryInterface.addIndex('users', ['oauth2Provider', 'oauth2Id'], {
        name: 'idx_users_oauth',
        using: 'BTREE',
      });
    }

    // Index for appointment date queries
    if (!(await indexExists('appointments', 'idx_appointments_date'))) {
      await queryInterface.addIndex('appointments', ['date'], {
        name: 'idx_appointments_date',
        using: 'BTREE',
      });
    }

    // Index for invoice date queries
    if (!(await indexExists('invoices', 'idx_invoices_created'))) {
      await queryInterface.addIndex('invoices', ['createdAt'], {
        name: 'idx_invoices_created',
        using: 'BTREE',
      });
    }

    // Index for attendance date queries
    if (!(await indexExists('attendance', 'idx_attendance_date'))) {
      await queryInterface.addIndex('attendance', ['date'], {
        name: 'idx_attendance_date',
        using: 'BTREE',
      });
    }

    // Composite index for attendance user and date
    if (!(await indexExists('attendance', 'idx_attendance_user_date'))) {
      await queryInterface.addIndex('attendance', ['userId', 'date'], {
        name: 'idx_attendance_user_date',
        using: 'BTREE',
      });
    }

    // Index for payroll period queries
    if (!(await indexExists('payrolls', 'idx_payrolls_period'))) {
      await queryInterface.addIndex('payrolls', ['year', 'month'], {
        name: 'idx_payrolls_period',
        using: 'BTREE',
      });
    }

    // Index for payroll user queries
    if (!(await indexExists('payrolls', 'idx_payrolls_user'))) {
      await queryInterface.addIndex('payrolls', ['userId'], {
        name: 'idx_payrolls_user',
        using: 'BTREE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('medicines', 'idx_medicines_name');
    await queryInterface.removeIndex('medicines', 'idx_medicines_code');
    await queryInterface.removeIndex('medicines', 'idx_medicines_group');
    await queryInterface.removeIndex('medicines', 'idx_medicines_quantity');
    await queryInterface.removeIndex('users', 'idx_users_email');
    await queryInterface.removeIndex('users', 'idx_users_oauth');
    await queryInterface.removeIndex('appointments', 'idx_appointments_date');
    await queryInterface.removeIndex('invoices', 'idx_invoices_created');
    await queryInterface.removeIndex('attendance', 'idx_attendance_date');
    await queryInterface.removeIndex('attendance', 'idx_attendance_user_date');
    await queryInterface.removeIndex('payrolls', 'idx_payrolls_period');
    await queryInterface.removeIndex('payrolls', 'idx_payrolls_user');
  }
};
