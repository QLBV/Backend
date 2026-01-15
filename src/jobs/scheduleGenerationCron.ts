import cron from "node-cron";
import { ScheduleGenerationService } from "../modules/shift/scheduleGeneration.service";

export function setupScheduleGenerationCron() {
  cron.schedule("0 0 25 * *", async () => {
    try {
      console.log("\n [CRON] Starting monthly schedule generation...");
      console.log(` Date: ${new Date().toISOString()}`);
      const result = await ScheduleGenerationService.generateMonthlySchedule();
      console.log(" [CRON] Schedule generation completed successfully");
      console.log(` Result:`, result);
    } catch (error) {
      console.error(" [CRON] Schedule generation failed:", error); 
    }
  });
  console.log(" Schedule generation cron job initialized");
  console.log(" Will run at 00:00 on the 25th of each month");
}

export function setupDailyScheduleGenerationCron() {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("\n [CRON - DAILY TEST] Starting schedule generation...");
      const result = await ScheduleGenerationService.generateMonthlySchedule();
      console.log(" [CRON - DAILY TEST] Completed:", result);
    } catch (error) {
      console.error(" [CRON - DAILY TEST] Failed:", error);
    }
  });
  console.log(" Daily schedule generation cron job initialized (TEST MODE)");
}

export function setupTestScheduleGenerationCron() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("\n [CRON - TEST MODE] Starting schedule generation...");
      const result = await ScheduleGenerationService.generateMonthlySchedule();
      console.log(" [CRON - TEST MODE] Completed:", result);
    } catch (error) {
      console.error(" [CRON - TEST MODE] Failed:", error);
    }
  });

  console.log("️  TEST MODE: Schedule generation will run every 5 minutes");
  console.log("️  DISABLE THIS IN PRODUCTION!");
}
