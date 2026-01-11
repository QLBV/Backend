import cron from "node-cron";
import { AttendanceService } from "../services/attendance.service";

/**
 * Job to automatically mark absence for users who didn't check in
 * Runs at 00:05 every day for the previous day
 */
export const startAttendanceJobs = () => {
  // 00:05 AM every day
  cron.schedule("5 0 * * *", async () => {
    console.log("⏰ Running job: autoMarkAbsence...");
    try {
      // Mark absence for yesterday
      const count = await AttendanceService.autoMarkAbsence();
      console.log(`✅ autoMarkAbsence job finished. Marked ${count} users as absent.`);
    } catch (error) {
      console.error("❌ autoMarkAbsence job failed:", error);
    }
  });
};
