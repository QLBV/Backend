import cron from "node-cron";
import { ScheduleGenerationService } from "../services/scheduleGeneration.service";

/**
 * Cron job to automatically generate schedule on 25th of each month
 * Runs at 00:00 (midnight) on the 25th day of every month
 */
export function setupScheduleGenerationCron() {
  // Run at midnight on 25th of every month
  // Format: '0 0 25 * *' = minute hour day month dayOfWeek
  cron.schedule("0 0 25 * *", async () => {
    try {
      console.log("\n🔄 [CRON] Starting monthly schedule generation...");
      console.log(`📅 Date: ${new Date().toISOString()}`);

      const result = await ScheduleGenerationService.generateMonthlySchedule();

      console.log("✅ [CRON] Schedule generation completed successfully");
      console.log(`📊 Result:`, result);
    } catch (error) {
      console.error("❌ [CRON] Schedule generation failed:", error);
      // You can add error notification here (email, Slack, etc.)
    }
  });

  console.log("✅ Schedule generation cron job initialized");
  console.log("📅 Will run at 00:00 on the 25th of each month");
}

/**
 * For testing: Run at specific time (e.g., every day at midnight)
 * Uncomment this for development/testing
 */
export function setupDailyScheduleGenerationCron() {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("\n🔄 [CRON - DAILY TEST] Starting schedule generation...");
      const result = await ScheduleGenerationService.generateMonthlySchedule();
      console.log("✅ [CRON - DAILY TEST] Completed:", result);
    } catch (error) {
      console.error("❌ [CRON - DAILY TEST] Failed:", error);
    }
  });

  console.log("✅ Daily schedule generation cron job initialized (TEST MODE)");
}

/**
 * For testing: Run every minute (development only!)
 */
export function setupTestScheduleGenerationCron() {
  // ONLY FOR DEVELOPMENT/TESTING - Remove in production
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("\n🔄 [CRON - TEST MODE] Starting schedule generation...");
      const result = await ScheduleGenerationService.generateMonthlySchedule();
      console.log("✅ [CRON - TEST MODE] Completed:", result);
    } catch (error) {
      console.error("❌ [CRON - TEST MODE] Failed:", error);
    }
  });

  console.log("⚠️  TEST MODE: Schedule generation will run every 5 minutes");
  console.log("⚠️  DISABLE THIS IN PRODUCTION!");
}
