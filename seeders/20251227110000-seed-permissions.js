'use strict';

/**
 * Permission Seeder
 *
 * Creates comprehensive permissions for all modules in the system
 * Format: {module}.{action}
 * Actions: view, create, edit, delete, manage
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const permissions = [
      // ============ PATIENTS MODULE ============
      { name: 'patients.view', description: 'View patient information', module: 'patients' },
      { name: 'patients.create', description: 'Create new patients', module: 'patients' },
      { name: 'patients.edit', description: 'Edit patient information', module: 'patients' },
      { name: 'patients.delete', description: 'Delete patients', module: 'patients' },
      { name: 'patients.manage', description: 'Full patient management', module: 'patients' },

      // ============ APPOINTMENTS MODULE ============
      { name: 'appointments.view', description: 'View appointments', module: 'appointments' },
      { name: 'appointments.create', description: 'Create appointments', module: 'appointments' },
      { name: 'appointments.edit', description: 'Edit appointments', module: 'appointments' },
      { name: 'appointments.delete', description: 'Cancel/delete appointments', module: 'appointments' },
      { name: 'appointments.checkin', description: 'Check-in patients for appointments', module: 'appointments' },

      // ============ VISITS MODULE ============
      { name: 'visits.view', description: 'View visit records', module: 'visits' },
      { name: 'visits.create', description: 'Create visit records', module: 'visits' },
      { name: 'visits.edit', description: 'Edit visit records', module: 'visits' },
      { name: 'visits.delete', description: 'Delete visit records', module: 'visits' },

      // ============ PRESCRIPTIONS MODULE ============
      { name: 'prescriptions.view', description: 'View prescriptions', module: 'prescriptions' },
      { name: 'prescriptions.create', description: 'Create prescriptions', module: 'prescriptions' },
      { name: 'prescriptions.edit', description: 'Edit prescriptions', module: 'prescriptions' },
      { name: 'prescriptions.delete', description: 'Delete prescriptions', module: 'prescriptions' },
      { name: 'prescriptions.pdf', description: 'Export prescription to PDF', module: 'prescriptions' },

      // ============ MEDICINES MODULE ============
      { name: 'medicines.view', description: 'View medicines', module: 'medicines' },
      { name: 'medicines.create', description: 'Add new medicines', module: 'medicines' },
      { name: 'medicines.edit', description: 'Edit medicine information', module: 'medicines' },
      { name: 'medicines.delete', description: 'Delete medicines', module: 'medicines' },
      { name: 'medicines.import', description: 'Import medicines to inventory', module: 'medicines' },
      { name: 'medicines.export', description: 'Export medicines from inventory', module: 'medicines' },
      { name: 'medicines.alerts', description: 'View medicine alerts (expiry, low stock)', module: 'medicines' },

      // ============ INVOICES MODULE ============
      { name: 'invoices.view', description: 'View invoices', module: 'invoices' },
      { name: 'invoices.create', description: 'Create invoices', module: 'invoices' },
      { name: 'invoices.edit', description: 'Edit invoices', module: 'invoices' },
      { name: 'invoices.delete', description: 'Delete invoices', module: 'invoices' },
      { name: 'invoices.payment', description: 'Process invoice payments', module: 'invoices' },
      { name: 'invoices.pdf', description: 'Export invoice to PDF', module: 'invoices' },

      // ============ PAYROLL MODULE ============
      { name: 'payroll.view', description: 'View payroll records', module: 'payroll' },
      { name: 'payroll.create', description: 'Create payroll records', module: 'payroll' },
      { name: 'payroll.edit', description: 'Edit payroll records', module: 'payroll' },
      { name: 'payroll.delete', description: 'Delete payroll records', module: 'payroll' },
      { name: 'payroll.approve', description: 'Approve payroll', module: 'payroll' },
      { name: 'payroll.pay', description: 'Mark payroll as paid', module: 'payroll' },
      { name: 'payroll.pdf', description: 'Export payroll to PDF', module: 'payroll' },
      { name: 'payroll.viewAll', description: 'View all staff payroll', module: 'payroll' },

      // ============ USERS MODULE ============
      { name: 'users.view', description: 'View user accounts', module: 'users' },
      { name: 'users.create', description: 'Create user accounts', module: 'users' },
      { name: 'users.edit', description: 'Edit user accounts', module: 'users' },
      { name: 'users.delete', description: 'Delete user accounts', module: 'users' },
      { name: 'users.changeRole', description: 'Change user roles', module: 'users' },
      { name: 'users.activate', description: 'Activate/deactivate users', module: 'users' },

      // ============ DOCTORS MODULE ============
      { name: 'doctors.view', description: 'View doctor information', module: 'doctors' },
      { name: 'doctors.create', description: 'Create doctor profiles', module: 'doctors' },
      { name: 'doctors.edit', description: 'Edit doctor information', module: 'doctors' },
      { name: 'doctors.delete', description: 'Delete doctor profiles', module: 'doctors' },
      { name: 'doctors.schedules', description: 'Manage doctor schedules', module: 'doctors' },

      // ============ SHIFTS MODULE ============
      { name: 'shifts.view', description: 'View work shifts', module: 'shifts' },
      { name: 'shifts.create', description: 'Create work shifts', module: 'shifts' },
      { name: 'shifts.edit', description: 'Edit work shifts', module: 'shifts' },
      { name: 'shifts.delete', description: 'Delete work shifts', module: 'shifts' },
      { name: 'shifts.assign', description: 'Assign doctors to shifts', module: 'shifts' },

      // ============ NOTIFICATIONS MODULE ============
      { name: 'notifications.view', description: 'View notifications', module: 'notifications' },
      { name: 'notifications.create', description: 'Create notifications', module: 'notifications' },
      { name: 'notifications.delete', description: 'Delete notifications', module: 'notifications' },
      { name: 'notifications.send', description: 'Send notifications to users', module: 'notifications' },

      // ============ DASHBOARD MODULE ============
      { name: 'dashboard.view', description: 'View dashboard', module: 'dashboard' },
      { name: 'dashboard.stats', description: 'View dashboard statistics', module: 'dashboard' },

      // ============ REPORTS MODULE ============
      { name: 'reports.revenue', description: 'View revenue reports', module: 'reports' },
      { name: 'reports.expense', description: 'View expense reports', module: 'reports' },
      { name: 'reports.profit', description: 'View profit reports', module: 'reports' },
      { name: 'reports.medicines', description: 'View medicine reports', module: 'reports' },
      { name: 'reports.patients', description: 'View patient reports', module: 'reports' },
      { name: 'reports.pdf', description: 'Export reports to PDF', module: 'reports' },

      // ============ PERMISSIONS MODULE ============
      { name: 'permissions.view', description: 'View permissions', module: 'permissions' },
      { name: 'permissions.create', description: 'Create permissions', module: 'permissions' },
      { name: 'permissions.delete', description: 'Delete permissions', module: 'permissions' },
      { name: 'permissions.assign', description: 'Assign permissions to roles', module: 'permissions' },

      // ============ SETTINGS MODULE ============
      { name: 'settings.view', description: 'View system settings', module: 'settings' },
      { name: 'settings.edit', description: 'Edit system settings', module: 'settings' },
    ];

    await queryInterface.bulkInsert('permissions',
      permissions.map(p => ({
        ...p,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};