"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("users", [
      {
        id: 5,
        email: "receptionist@healthcare.com",
        password: "$2b$10$A9/paq4jTcq.ITRvOl2UMuZoMLhM8FHFWzjWpoV.6Ti2vsUrodZAq", // admin123
        fullName: "Nguyễn Thị Lễ Tân",
        roleId: 4, // RECEPTIONIST
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: "receptionist@healthcare.com" }, {});
  },
};
