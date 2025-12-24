"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("roles", [
      {
        id: 1,
        name: "ADMIN",
        description: "Quản trị viên hệ thống",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "DOCTOR",
        description: "Bác sĩ",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "PATIENT",
        description: "Bệnh nhân",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: "RECEPTIONIST",
        description: "Lễ tân",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};
