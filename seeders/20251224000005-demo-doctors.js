"use strict";

module.exports = {
  async up(queryInterface) {
    // Tạo users cho doctors
    await queryInterface.bulkInsert("users", [
      {
        id: 2,
        email: "bsnguyen@healthcare.com",
        password: "$2b$10$A9/paq4jTcq.ITRvOl2UMuZoMLhM8FHFWzjWpoV.6Ti2vsUrodZAq", // admin123
        fullName: "BS. Nguyễn Văn A",
        roleId: 2, // DOCTOR
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        email: "bstran@healthcare.com",
        password: "$2b$10$A9/paq4jTcq.ITRvOl2UMuZoMLhM8FHFWzjWpoV.6Ti2vsUrodZAq", // admin123
        fullName: "BS. Trần Thị B",
        roleId: 2, // DOCTOR
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        email: "bsle@healthcare.com",
        password: "$2b$10$A9/paq4jTcq.ITRvOl2UMuZoMLhM8FHFWzjWpoV.6Ti2vsUrodZAq", // admin123
        fullName: "BS. Lê Văn C",
        roleId: 2, // DOCTOR
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Tạo doctors
    await queryInterface.bulkInsert("doctors", [
      {
        id: 1,
        doctorCode: "BS000001",
        userId: 2,
        specialtyId: 1, // Nội khoa
        position: "Bác sĩ chuyên khoa II",
        degree: "Thạc sĩ",
        description: "Chuyên điều trị bệnh lý nội khoa",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        doctorCode: "BS000002",
        userId: 3,
        specialtyId: 3, // Sản phụ khoa
        position: "Bác sĩ chuyên khoa I",
        degree: "Bác sĩ",
        description: "Chuyên điều trị bệnh phụ khoa",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        doctorCode: "BS000003",
        userId: 4,
        specialtyId: 5, // Tim mạch
        position: "Phó giáo sư",
        degree: "Tiến sĩ",
        description: "Chuyên điều trị bệnh tim mạch",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("doctors", null, {});
    await queryInterface.bulkDelete("users", { roleId: 2 }, {});
  },
};
