import sequelize from "../config/database";

const addMaxSlotsColumn = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn("doctor_shifts", "maxSlots", {
      type: "INTEGER",
      allowNull: true,
      defaultValue: null,
    });
    console.log("✅ Added 'maxSlots' column (INT, NULL) to 'doctor_shifts' table.");
  } catch (error: any) {
    if (error.original && error.original.code === "ER_DUP_FIELDNAME") {
      console.log("⚠️ Column 'maxSlots' already exists in 'doctor_shifts'.");
    } else {
      console.error("❌ Failed to add column:", error);
    }
  } finally {
    await sequelize.close();
  }
};

addMaxSlotsColumn();
