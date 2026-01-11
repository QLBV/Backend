'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Roles to include in Employees table: Admin (1), Receptionist (2), Doctor (4)
    const [users] = await queryInterface.sequelize.query(
      'SELECT id, roleId, createdAt FROM users WHERE roleId IN (1, 2, 4)'
    );

    if (users && users.length > 0) {
      const existingEmployees = await queryInterface.sequelize.query(
        'SELECT userId FROM employees',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      const existingUserIds = new Set(existingEmployees.map(e => e.userId));

      const employeesToCreate = [];
      for (const user of users) {
        if (!existingUserIds.has(user.id)) {
          let prefix = 'EMP';
          if (user.roleId === 1) prefix = 'AD';
          if (user.roleId === 2) prefix = 'LT';
          if (user.roleId === 4) prefix = 'BS';

          employeesToCreate.push({
            employeeCode: `${prefix}${Math.floor(1000 + Math.random() * 9000)}`,
            userId: user.id,
            position: user.roleId === 4 ? 'Bác sĩ' : (user.roleId === 2 ? 'Lễ tân' : 'Quản trị viên'),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      if (employeesToCreate.length > 0) {
        await queryInterface.bulkInsert('employees', employeesToCreate);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No easy way to undo without risk of deleting manually created employees, 
    // but we can leave it as is or implement a selective delete if needed.
  }
};
