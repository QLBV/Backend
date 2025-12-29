'use strict';

/**
 * Role Permissions Seeder
 *
 * Assigns default permissions to each role:
 * - ADMIN: All permissions
 * - DOCTOR: Medical-related permissions
 * - RECEPTIONIST: Front-desk permissions
 * - PATIENT: Limited view permissions
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get role IDs
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM roles',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleMap = roles.reduce((acc, role) => {
      acc[role.name] = role.id;
      return acc;
    }, {});

    // Get all permissions
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM permissions',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const permissionMap = permissions.reduce((acc, permission) => {
      acc[permission.name] = permission.id;
      return acc;
    }, {});

    // Helper function to create role-permission mappings
    const createRolePermissions = (roleId, permissionNames) => {
      return permissionNames
        .filter(name => permissionMap[name]) // Only include existing permissions
        .map(name => ({
          roleId,
          permissionId: permissionMap[name],
        }));
    };

    const rolePermissions = [];

    // ============ ADMIN PERMISSIONS (ALL) ============
    if (roleMap['ADMIN']) {
      rolePermissions.push(
        ...permissions.map(p => ({
          roleId: roleMap['ADMIN'],
          permissionId: p.id,
        }))
      );
    }

    // ============ DOCTOR PERMISSIONS ============
    if (roleMap['DOCTOR']) {
      const doctorPermissions = [
        // Patients
        'patients.view',
        'patients.edit',

        // Appointments
        'appointments.view',
        'appointments.checkin',

        // Visits
        'visits.view',
        'visits.create',
        'visits.edit',

        // Prescriptions
        'prescriptions.view',
        'prescriptions.create',
        'prescriptions.edit',
        'prescriptions.pdf',

        // Medicines
        'medicines.view',

        // Invoices (read-only)
        'invoices.view',

        // Payroll (own only)
        'payroll.view',
        'payroll.pdf',

        // Doctors
        'doctors.view',
        'doctors.schedules',

        // Shifts
        'shifts.view',

        // Notifications
        'notifications.view',
      ];

      rolePermissions.push(...createRolePermissions(roleMap['DOCTOR'], doctorPermissions));
    }

    // ============ RECEPTIONIST PERMISSIONS ============
    if (roleMap['RECEPTIONIST']) {
      const receptionistPermissions = [
        // Patients
        'patients.view',
        'patients.create',
        'patients.edit',

        // Appointments
        'appointments.view',
        'appointments.create',
        'appointments.edit',
        'appointments.delete',
        'appointments.checkin',

        // Visits (read-only)
        'visits.view',

        // Prescriptions (read-only)
        'prescriptions.view',
        'prescriptions.pdf',

        // Medicines (view and alerts)
        'medicines.view',
        'medicines.alerts',

        // Invoices
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.payment',
        'invoices.pdf',

        // Payroll (own only)
        'payroll.view',
        'payroll.pdf',

        // Doctors (view schedules)
        'doctors.view',
        'doctors.schedules',

        // Shifts
        'shifts.view',

        // Notifications
        'notifications.view',
        'notifications.create',
      ];

      rolePermissions.push(...createRolePermissions(roleMap['RECEPTIONIST'], receptionistPermissions));
    }

    // ============ PATIENT PERMISSIONS ============
    if (roleMap['PATIENT']) {
      const patientPermissions = [
        // Appointments (own only)
        'appointments.view',
        'appointments.create',
        'appointments.delete',

        // Visits (own only, read-only)
        'visits.view',

        // Prescriptions (own only, read-only)
        'prescriptions.view',
        'prescriptions.pdf',

        // Invoices (own only)
        'invoices.view',
        'invoices.pdf',

        // Doctors (view for booking)
        'doctors.view',

        // Notifications
        'notifications.view',
      ];

      rolePermissions.push(...createRolePermissions(roleMap['PATIENT'], patientPermissions));
    }

    // Insert role-permissions
    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermissions);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
};