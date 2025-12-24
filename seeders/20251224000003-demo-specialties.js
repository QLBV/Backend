"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("specialties", [
      {
        id: 1,
        name: "Nội khoa",
        description: "Chuyên khoa nội tổng quát",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "Ngoại khoa",
        description: "Chuyên khoa ngoại tổng quát",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Sản phụ khoa",
        description: "Chuyên khoa sản phụ",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: "Nhi khoa",
        description: "Chuyên khoa nhi",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        name: "Tim mạch",
        description: "Chuyên khoa tim mạch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        name: "Da liễu",
        description: "Chuyên khoa da liễu",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("specialties", null, {});
  },
};
