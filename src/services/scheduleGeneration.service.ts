import { Transaction } from "sequelize";
import { ShiftTemplate, DoctorShift, sequelize } from "../models";
import { DoctorShiftStatus } from "../models/DoctorShift";
import { AppError } from "../utils/AppError";

export class ScheduleGenerationService {
  /**
   * Generate schedule for next month from templates
   * Run this on 25th of each month
   */
  static async generateMonthlySchedule() {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // Get next month dates
      const { startDate, endDate, year, month } = this.getNextMonthRange();

      console.log(
        `Generating schedule for ${year}-${month
          .toString()
          .padStart(2, "0")} (${startDate} to ${endDate})`
      );

      // Get all active templates
      const templates = await ShiftTemplate.findAll({
        where: { isActive: true },
        transaction,
      });

      if (templates.length === 0) {
        throw new AppError(
          "NO_ACTIVE_TEMPLATES",
          "No active shift templates found. Please create templates first.",
          400
        );
      }

      console.log(`📋 Found ${templates.length} active templates`);

      // Generate shifts for each day of the month
      let generatedCount = 0;
      let skippedCount = 0;

      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        // Convert to our format: 1=Monday, 7=Sunday
        const dayOfWeekAdjusted = dayOfWeek === 0 ? 7 : dayOfWeek;

        // Find templates for this day of week
        const dayTemplates = templates.filter(
          (t) => t.dayOfWeek === dayOfWeekAdjusted
        );

        // Create doctor shifts for each template
        for (const template of dayTemplates) {
          const dateStr = current.toISOString().split("T")[0];

          // Check if shift already exists
          const existing = await DoctorShift.findOne({
            where: {
              doctorId: template.doctorId,
              shiftId: template.shiftId,
              workDate: dateStr,
            },
            transaction,
          });

          if (existing) {
            skippedCount++;
            console.log(
              `Skipping existing: Doctor ${template.doctorId}, Shift ${template.shiftId} on ${dateStr}`
            );
            continue;
          }

          // Create new doctor shift
          await DoctorShift.create(
            {
              doctorId: template.doctorId,
              shiftId: template.shiftId,
              workDate: dateStr,
              status: DoctorShiftStatus.ACTIVE,
            },
            { transaction }
          );

          generatedCount++;
        }

        // Move to next day
        current.setDate(current.getDate() + 1);
      }

      await transaction.commit();

      console.log(
        `Schedule generation complete: ${generatedCount} shifts created, ${skippedCount} skipped`
      );

      return {
        success: true,
        message: `Successfully generated schedule for ${year}-${month
          .toString()
          .padStart(2, "0")}`,
        generated: generatedCount,
        skipped: skippedCount,
        period: {
          year,
          month,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Schedule generation failed:", error);
      throw error;
    }
  }

  /**
   * Generate schedule for a specific month
   */
  static async generateScheduleForMonth(year: number, month: number) {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // Validate month (1-12)
      if (month < 1 || month > 12) {
        throw new AppError("INVALID_MONTH", "Month must be between 1 and 12", 400);
      }

      // Get month date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      console.log(
        `Generating schedule for ${year}-${month.toString().padStart(2, "0")}`
      );

      // Get all active templates
      const templates = await ShiftTemplate.findAll({
        where: { isActive: true },
        transaction,
      });

      if (templates.length === 0) {
        throw new AppError(
          "NO_ACTIVE_TEMPLATES",
          "No active shift templates found. Please create templates first.",
          400
        );
      }

      let generatedCount = 0;
      let skippedCount = 0;

      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        const dayOfWeekAdjusted = dayOfWeek === 0 ? 7 : dayOfWeek;

        const dayTemplates = templates.filter(
          (t) => t.dayOfWeek === dayOfWeekAdjusted
        );

        for (const template of dayTemplates) {
          const dateStr = current.toISOString().split("T")[0];

          const existing = await DoctorShift.findOne({
            where: {
              doctorId: template.doctorId,
              shiftId: template.shiftId,
              workDate: dateStr,
            },
            transaction,
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          await DoctorShift.create(
            {
              doctorId: template.doctorId,
              shiftId: template.shiftId,
              workDate: dateStr,
              status: DoctorShiftStatus.ACTIVE,
            },
            { transaction }
          );

          generatedCount++;
        }

        current.setDate(current.getDate() + 1);
      }

      await transaction.commit();

      return {
        success: true,
        message: `Successfully generated schedule for ${year}-${month
          .toString()
          .padStart(2, "0")}`,
        generated: generatedCount,
        skipped: skippedCount,
        period: {
          year,
          month,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get next month date range
   */
  private static getNextMonthRange() {
    const now = new Date();
    const year =
      now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const month = now.getMonth() === 11 ? 1 : now.getMonth() + 2;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return { startDate, endDate, year, month };
  }

  /**
   * Preview schedule generation (doesn't create, just shows what would be created)
   */
  static async previewMonthlySchedule() {
    const { startDate, endDate, year, month } = this.getNextMonthRange();

    const templates = await ShiftTemplate.findAll({
      where: { isActive: true },
    });

    if (templates.length === 0) {
      return {
        success: false,
        message: "No active templates found",
        shifts: [],
      };
    }

    const shifts: any[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dayOfWeekAdjusted = dayOfWeek === 0 ? 7 : dayOfWeek;

      const dayTemplates = templates.filter(
        (t) => t.dayOfWeek === dayOfWeekAdjusted
      );

      for (const template of dayTemplates) {
        const dateStr = current.toISOString().split("T")[0];

        const existing = await DoctorShift.findOne({
          where: {
            doctorId: template.doctorId,
            shiftId: template.shiftId,
            workDate: dateStr,
          },
        });

        shifts.push({
          date: dateStr,
          doctorId: template.doctorId,
          shiftId: template.shiftId,
          exists: !!existing,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      success: true,
      period: {
        year,
        month,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      totalTemplates: templates.length,
      totalShifts: shifts.length,
      newShifts: shifts.filter((s) => !s.exists).length,
      existingShifts: shifts.filter((s) => s.exists).length,
      shifts,
    };
  }
}
