"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("appointments", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      patientId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "patients",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      doctorId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "doctors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      shiftId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "shifts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      slotNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      bookingType: {
        type: Sequelize.ENUM("ONLINE", "OFFLINE"),
        allowNull: false,
      },
      bookedBy: {
        type: Sequelize.ENUM("PATIENT", "RECEPTIONIST"),
        allowNull: false,
      },
      symptomInitial: {
        type: Sequelize.TEXT,
      },
      status: {
        type: Sequelize.ENUM("WAITING", "CANCELLED", "CHECKED_IN"),
        defaultValue: "WAITING",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    
    await queryInterface.addIndex("appointments", ["doctorId", "shiftId", "date", "slotNumber"], {
      unique: true,
      name: "appointments_slot_unique",
    });

    
    await queryInterface.addIndex("appointments", ["patientId"]);
    await queryInterface.addIndex("appointments", ["date"]);
    await queryInterface.addIndex("appointments", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("appointments");
  },
};
