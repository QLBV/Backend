import cron from "node-cron";
import { AttendanceService } from "../modules/shift/attendance.service";

export const startAttendanceJobs = () => {
  cron.schedule("5 0 * * *", async () => {
    console.log("⏰ Running job: autoMarkAbsence...");
    try {
      const count = await AttendanceService.autoMarkAbsence();
      console.log(` autoMarkAbsence job finished. Marked ${count} users as absent.`);
    } catch (error) {
      console.error(" autoMarkAbsence job failed:", error);
    }
  });
};
