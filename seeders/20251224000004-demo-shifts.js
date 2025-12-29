"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("shifts", [
      {
        id: 1,
        name: "Sáng",
        startTime: "07:00",
        endTime: "11:00",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "Chiều",
        startTime: "13:00",
        endTime: "17:00",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Tối",
        startTime: "18:00",
        endTime: "21:00",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("shifts", null, {});
  },
};
