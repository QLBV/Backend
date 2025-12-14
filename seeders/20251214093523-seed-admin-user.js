"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1️⃣ Lấy role ADMIN
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1"
    );

    if (!roles.length) {
      throw new Error("ADMIN role not found");
    }

    const adminRoleId = roles[0].id;

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // 3️⃣ Insert admin user
    await queryInterface.bulkInsert("users", [
      {
        email: "admin@healthcare.com",
        password: hashedPassword,
        fullName: "System Administrator",
        roleId: adminRoleId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: "admin@healthcare.com",
    });
  },
};
