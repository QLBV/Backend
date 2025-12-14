"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("roles", [
      {
        name: "ADMIN",
        description: "Quản trị hệ thống",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "DOCTOR",
        description: "Bác sĩ",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "RECEPTIONIST",
        description: "Lễ tân",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "PATIENT",
        description: "Bệnh nhân",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};
