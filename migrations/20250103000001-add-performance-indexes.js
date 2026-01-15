'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    const indexExists = async (tableName, indexName) => {
      const [indexes] = await queryInterface.sequelize.query(`
        SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}'
      `);
      return indexes.length > 0;
    };

    if (!(await indexExists('appointments', 'idx_appointments_patient_date'))) {
      await queryInterface.addIndex('appointments', ['patientId', 'date'], {
        name: 'idx_appointments_patient_date',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('prescriptions', 'idx_prescriptions_patient_created'))) {
      await queryInterface.addIndex('prescriptions', ['patientId', 'createdAt'], {
        name: 'idx_prescriptions_patient_created',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('invoices', 'idx_invoices_patient_created'))) {
      await queryInterface.addIndex('invoices', ['patientId', 'createdAt'], {
        name: 'idx_invoices_patient_created',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('medicines', 'idx_medicines_status_expiry'))) {
      await queryInterface.addIndex('medicines', ['status', 'expiryDate'], {
        name: 'idx_medicines_status_expiry',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('appointments', 'idx_appointments_status'))) {
      await queryInterface.addIndex('appointments', ['status'], {
        name: 'idx_appointments_status',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('visits', 'idx_visits_status'))) {
      await queryInterface.addIndex('visits', ['status'], {
        name: 'idx_visits_status',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('prescriptions', 'idx_prescriptions_status'))) {
      await queryInterface.addIndex('prescriptions', ['status'], {
        name: 'idx_prescriptions_status',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('invoices', 'idx_invoices_paymentStatus'))) {
      await queryInterface.addIndex('invoices', ['paymentStatus'], {
        name: 'idx_invoices_paymentStatus',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('doctor_shifts', 'idx_doctor_shifts_doctor_date'))) {
      await queryInterface.addIndex('doctor_shifts', ['doctorId', 'workDate'], {
        name: 'idx_doctor_shifts_doctor_date',
        using: 'BTREE',
      });
    }

    if (!(await indexExists('users', 'idx_users_roleId'))) {
      await queryInterface.addIndex('users', ['roleId'], {
        name: 'idx_users_roleId',
        using: 'BTREE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('appointments', 'idx_appointments_patient_date');
    await queryInterface.removeIndex('prescriptions', 'idx_prescriptions_patient_created');
    await queryInterface.removeIndex('invoices', 'idx_invoices_patient_created');
    await queryInterface.removeIndex('medicines', 'idx_medicines_status_expiry');
    await queryInterface.removeIndex('appointments', 'idx_appointments_status');
    await queryInterface.removeIndex('visits', 'idx_visits_status');
    await queryInterface.removeIndex('prescriptions', 'idx_prescriptions_status');
    await queryInterface.removeIndex('invoices', 'idx_invoices_paymentStatus');
    await queryInterface.removeIndex('doctor_shifts', 'idx_doctor_shifts_doctor_date');
    await queryInterface.removeIndex('users', 'idx_users_roleId');
  }
};
