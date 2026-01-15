import cron from "node-cron";
import { autoMarkExpiredMedicinesService } from "../modules/inventory/medicine.service";
import {
  notifyExpiredMedicines,
  notifyLowStockMedicines,
  notifyExpiringMedicines,
} from "../modules/inventory/medicineNotification.service";

export const startMedicineExpiryCheck = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Running scheduled job: Medicine Expiry Check`
      );
      const result = await autoMarkExpiredMedicinesService();
      console.log(
        `[${new Date().toISOString()}] Medicine Expiry Check completed: ${result.markedCount} medicine(s) marked as expired`
      );
      if (result.markedCount > 0) {
        result.medicines.forEach((medicine) => {
          console.log(
            `  - ${medicine.medicineCode} | ${medicine.name} | Expired: ${medicine.expiryDate}`
          );
        });
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
    " Medicine Expiry Check job scheduled (runs daily at 00:00)"
  );
};

export const startLowStockCheck = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Running scheduled job: Low Stock Check`
      );
      const { getLowStockMedicinesService } = await import(
        "../modules/inventory/medicine.service"
      );
      const { medicines: lowStockMedicines } = await getLowStockMedicinesService({ limit: 100 });
      console.log(
        `[${new Date().toISOString()}] Low Stock Check completed: ${lowStockMedicines.length} medicine(s) with low stock`
      );

      if (lowStockMedicines.length > 0) {
        console.log("️  Medicines with low stock:");
        lowStockMedicines.forEach((medicine) => {
          console.log(
            `- ${medicine.medicineCode} | ${medicine.name} | Quantity: ${medicine.quantity}/${medicine.minStockLevel}`
          );
        });

        
        await notifyLowStockMedicines(lowStockMedicines);
      }
    } catch (error: any) {
      console.error(
        `[${new Date().toISOString()}] Low Stock Check failed:`,
        error.message
      );
    }
  });
  console.log(" Low Stock Check job scheduled (runs daily at 08:00)");
};

export const startExpiringMedicinesCheck = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log(
        `[${new Date().toISOString()}] Running scheduled job: Expiring Medicines Check`
      );
      const { getExpiringMedicinesService } = await import(
        "../modules/inventory/medicine.service"
      );
      const { medicines: expiringMedicines } = await getExpiringMedicinesService(30, { limit: 100 });
      console.log(
        `[${new Date().toISOString()}] Expiring Medicines Check completed: ${expiringMedicines.length} medicine(s) expiring within 30 days`
      );

      if (expiringMedicines.length > 0) {
        console.log("️  Medicines expiring soon:");
        expiringMedicines.forEach((medicine: any) => {
          console.log(
            `  - ${medicine.medicineCode} | ${medicine.name} | Expires in ${medicine.daysUntilExpiry} day(s) | Expiry Date: ${medicine.expiryDate}`
          );
        });
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
    " Expiring Medicines Check job scheduled (runs daily at 09:00)"
  );
};

export const startAllMedicineJobs = () => {
  console.log("\n Starting Medicine Management Scheduled Jobs...");
  startMedicineExpiryCheck();
  startLowStockCheck();
  startExpiringMedicinesCheck();
  console.log(" All medicine jobs started successfully\n");
};
