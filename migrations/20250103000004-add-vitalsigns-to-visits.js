'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add checkOutTime to visits
    await queryInterface.addColumn('visits', 'checkOutTime', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Thời gian kết thúc khám',
      after: 'checkInTime',
    });

    // Add vitalSigns (JSON) to visits
    await queryInterface.addColumn('visits', 'vitalSigns', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Dấu hiệu sinh tồn: bloodPressure, heartRate, temperature, weight, height',
      after: 'diagnosis',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('visits', 'checkOutTime');
    await queryInterface.removeColumn('visits', 'vitalSigns');
  },
};
