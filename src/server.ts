import dotenv from "dotenv";
dotenv.config();

// Force console output immediately (no buffering)
if ((process.stdout as any)._handle) {
  (process.stdout as any)._handle.setBlocking(true);
}
if ((process.stderr as any)._handle) {
  (process.stderr as any)._handle.setBlocking(true);
}

import app from "./app";
import { startAllMedicineJobs } from "./jobs/medicineExpiryCheck";
import { setupScheduleGenerationCron } from "./jobs/scheduleGenerationCron";
import { sequelize } from "./models";

const PORT = process.env.PORT || 5000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected via Sequelize");

    // Start scheduled jobs after database connection
    startAllMedicineJobs();
    setupScheduleGenerationCron();
  } catch (error) {
    console.error("❌ Database connection failed", error);
  }
})();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);

  // Debug: Check middleware stack
  console.log(`📊 Total middleware/routes registered: ${(app as any)._router?.stack?.length || 'unknown'}`);
});
