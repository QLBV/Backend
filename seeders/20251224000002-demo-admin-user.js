"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        email: "admin@healthcare.com",
        password: "$2b$10$A9/paq4jTcq.ITRvOl2UMuZoMLhM8FHFWzjWpoV.6Ti2vsUrodZAq", // admin123
        fullName: "Administrator",
        roleId: 1, // ADMIN
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: "admin@healthcare.com" }, {});
  },
};
