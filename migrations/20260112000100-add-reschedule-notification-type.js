/**
 * Add APPOINTMENT_RESCHEDULED to notifications.type enum
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("notifications", "type", {
      type: Sequelize.ENUM(
        "APPOINTMENT_CREATED",
        "APPOINTMENT_CANCELLED",
        "DOCTOR_CHANGED",
        "APPOINTMENT_RESCHEDULED",
        "SYSTEM"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("notifications", "type", {
      type: Sequelize.ENUM(
        "APPOINTMENT_CREATED",
        "APPOINTMENT_CANCELLED",
        "DOCTOR_CHANGED",
        "SYSTEM"
      ),
      allowNull: false,
    });
  },
};
