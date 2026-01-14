import cron from "node-cron";
import { autoMarkExpiredMedicinesService } from "../services/medicine.service";
import {
  notifyExpiredMedicines,
  notifyLowStockMedicines,
  notifyExpiringMedicines,
} from "../services/medicineNotification.service";

/**
 * Scheduled job to automatically mark expired medicines
 * Runs daily at 00:00 (midnight)
 *
 * Cron schedule format: "minute hour day month weekday"
 * "0 0 * * *" = At 00:00 every day
 */
export const startMedicineExpiryCheck = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Running scheduled job: Medicine Expiry Check`
      );

      const result = await autoMarkExpiredMedicinesService();

      console.log(
        `[${new Date().toISOString()}] Medicine Expiry Check completed: ${result.markedCount} medicine(s) marked as expired`
      );

      // Log details if any medicines were marked
      if (result.markedCount > 0) {
        result.medicines.forEach((medicine) => {
          console.log(
            `  - ${medicine.medicineCode} | ${medicine.name} | Expired: ${medicine.expiryDate}`
          );
        });

        // Send notification to admins
        await notifyExpiredMedicines(result.medicines);
      }
    } catch (error: any) {
      console.error(
        `[${new Date().toISOString()}] Medicine Expiry Check failed:`,
        error.message
      );
    }
  });

  console.log(
    "✅ Medicine Expiry Check job scheduled (runs daily at 00:00)"
  );
};

/**
 * Optional: Low stock check job
 * Runs every day at 08:00 AM
 */
export const startLowStockCheck = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Running scheduled job: Low Stock Check`
      );

      // Import service
      const { getLowStockMedicinesService } = await import(
        "../services/medicine.service"
      );

      const lowStockMedicines = await getLowStockMedicinesService();

      console.log(
        `[${new Date().toISOString()}] Low Stock Check completed: ${lowStockMedicines.length} medicine(s) with low stock`
      );

      if (lowStockMedicines.length > 0) {
        console.log("⚠️  Medicines with low stock:");
        lowStockMedicines.forEach((medicine) => {
          console.log(
            `  - ${medicine.medicineCode} | ${medicine.name} | Quantity: ${medicine.quantity}/${medicine.minStockLevel}`
          );
        });

        // Send notification to admins
        await notifyLowStockMedicines(lowStockMedicines);
      }
    } catch (error: any) {
      console.error(
        `[${new Date().toISOString()}] Low Stock Check failed:`,
        error.message
      );
    }
  });

  console.log("✅ Low Stock Check job scheduled (runs daily at 08:00)");
};

/**
 * Optional: Expiring medicines warning check
 * Runs every day at 09:00 AM
 */
export const startExpiringMedicinesCheck = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Running scheduled job: Expiring Medicines Check`
      );

      // Import service
      const { getExpiringMedicinesService } = await import(
        "../services/medicine.service"
      );

      // Check medicines expiring within 30 days
      const expiringMedicines = await getExpiringMedicinesService(30);

      console.log(
        `[${new Date().toISOString()}] Expiring Medicines Check completed: ${expiringMedicines.length} medicine(s) expiring within 30 days`
      );

      if (expiringMedicines.length > 0) {
        console.log("⚠️  Medicines expiring soon:");
        expiringMedicines.forEach((medicine: any) => {
          console.log(
            `  - ${medicine.medicineCode} | ${medicine.name} | Expires in ${medicine.daysUntilExpiry} day(s) | Expiry Date: ${medicine.expiryDate}`
          );
        });

        // Send notification to admins
        await notifyExpiringMedicines(expiringMedicines, 30);
      }
    } catch (error: any) {
      console.error(
        `[${new Date().toISOString()}] Expiring Medicines Check failed:`,
        error.message
      );
    }
  });

  console.log(
    "✅ Expiring Medicines Check job scheduled (runs daily at 09:00)"
  );
};

/**
 * Start all medicine-related scheduled jobs
 */
export const startAllMedicineJobs = () => {
  console.log("\n📅 Starting Medicine Management Scheduled Jobs...");
  startMedicineExpiryCheck();
  startLowStockCheck();
  startExpiringMedicinesCheck();
  console.log("✅ All medicine jobs started successfully\n");
};
