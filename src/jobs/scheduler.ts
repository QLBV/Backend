import cron from "node-cron";
import { runAutoNoShowJob } from "./autoNoShow.job";
import { startAttendanceJobs } from "./attendance.job";

export function initializeScheduler() {
  console.log("[Scheduler] Initializing job scheduler...");
  const autoNoShowSchedule = "*/30 * * * *";
  cron.schedule(autoNoShowSchedule, async () => {
    console.log(`[Scheduler] Triggered auto no-show job at ${new Date().toISOString()}`);
    try {
      await runAutoNoShowJob();
    } catch (error) {
      console.error("[Scheduler] Auto no-show job failed:", error);
    }
  });
  console.log(`[Scheduler] Auto no-show job scheduled: ${autoNoShowSchedule} (every 30 minutes)`);
  startAttendanceJobs();

  console.log("[Scheduler] All jobs initialized successfully");
}

export function stopScheduler() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log("[Scheduler] All jobs stopped");
}
