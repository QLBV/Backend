/**
 * Job Scheduler
 * Sets up cron jobs to run automatically
 *
 * Usage:
 * - Import and call initializeScheduler() in server.ts after database connection
 */

import cron from "node-cron";
import { runAutoNoShowJob } from "./autoNoShow.job";
import { startAttendanceJobs } from "./attendance.job";

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing job scheduler...");

  // Auto No-Show Job: Run every 30 minutes
  // Cron syntax: "*/30 * * * *" = every 30 minutes
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

  // Add more scheduled jobs here in the future
  // Example:
  // });
  
  // Attendance Jobs
  startAttendanceJobs();

  console.log("[Scheduler] All jobs initialized successfully");
}

/**
 * Stop all scheduled jobs (useful for testing or graceful shutdown)
 */
export function stopScheduler() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  console.log("[Scheduler] All jobs stopped");
}
