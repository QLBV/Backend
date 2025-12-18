module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("visits", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      visit_code: {
        type: Sequelize.STRING,
        unique: true,
      },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      visit_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      symptom_initial: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("waiting", "examining", "done"),
        defaultValue: "waiting",
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("visits");
  },
};
