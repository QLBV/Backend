/**
 * Auto No-Show Job
 * Automatically marks appointments as NO_SHOW if patient hasn't checked in
 * 30 minutes after the appointment time
 *
 * Run this job every 30 minutes via cron scheduler
 */

import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import Shift from "../models/Shift";
import { BOOKING_CONFIG } from "../config/booking.config";

/**
 * Calculate appointment time based on date, shift start time, and slot number
 */
function calculateAppointmentTime(
  date: Date,
  shiftStartTime: string,
  slotNumber: number
): Date {
  const [hours, minutes] = shiftStartTime.split(":").map(Number);
  const appointmentTime = new Date(date);
  appointmentTime.setHours(hours, minutes, 0, 0);

  // Add slot offset (each slot is SLOT_MINUTES apart)
  const minutesToAdd = (slotNumber - 1) * BOOKING_CONFIG.SLOT_MINUTES;
  appointmentTime.setMinutes(appointmentTime.getMinutes() + minutesToAdd);

  return appointmentTime;
}

/**
 * Main job function: Mark overdue appointments as NO_SHOW
 */
export async function runAutoNoShowJob(): Promise<{
  success: boolean;
  processedCount: number;
  markedAsNoShow: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processedCount = 0;
  let markedAsNoShow = 0;

  try {
    console.log("[AutoNoShow] Starting auto no-show job...");

    // 1. Get today's and yesterday's WAITING appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const appointments = await Appointment.findAll({
      where: {
        status: "WAITING",
        date: {
          [Op.gte]: yesterday, // From yesterday onwards
          [Op.lte]: today, // Up to today
        },
      },
      include: [
        {
          model: Shift,
          as: "shift",
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
    });

    console.log(`[AutoNoShow] Found ${appointments.length} WAITING appointments to check`);

    // 2. Check each appointment
    const now = new Date();
    const NO_SHOW_THRESHOLD_MINUTES = 30; // Mark as no-show if 30 minutes late

    for (const appointment of appointments) {
      processedCount++;

      try {
        const shift = (appointment as any).shift;
        if (!shift) {
          errors.push(`Appointment ${appointment.id}: Shift not found`);
          continue;
        }

        // Calculate appointment time
        const appointmentTime = calculateAppointmentTime(
          new Date(appointment.date),
          shift.startTime,
          appointment.slotNumber
        );

        // Add threshold: appointment time + 30 minutes
        const noShowDeadline = new Date(
          appointmentTime.getTime() + NO_SHOW_THRESHOLD_MINUTES * 60 * 1000
        );

        // If current time > deadline, mark as NO_SHOW
        if (now > noShowDeadline) {
          await appointment.update({ status: "NO_SHOW" });

          // CRITICAL: Update patient no-show tracking
          const Patient = (await import("../models/Patient")).default;
          const patient = await Patient.findByPk(appointment.patientId);
          if (patient) {
            patient.noShowCount = (patient.noShowCount || 0) + 1;
            patient.lastNoShowDate = new Date();
            await patient.save();
          }

          markedAsNoShow++;

          console.log(
            `[AutoNoShow] Marked appointment ${appointment.id} as NO_SHOW ` +
            `(scheduled: ${appointmentTime.toISOString()}, ` +
            `deadline: ${noShowDeadline.toISOString()}, ` +
            `patient noShowCount: ${patient?.noShowCount || 0})`
          );
        }
      } catch (err: any) {
        errors.push(`Appointment ${appointment.id}: ${err.message}`);
        console.error(`[AutoNoShow] Error processing appointment ${appointment.id}:`, err);
      }
    }

    console.log(
      `[AutoNoShow] Job completed. Processed: ${processedCount}, ` +
      `Marked as NO_SHOW: ${markedAsNoShow}, Errors: ${errors.length}`
    );

    return {
      success: true,
      processedCount,
      markedAsNoShow,
      errors,
    };
  } catch (error: any) {
    console.error("[AutoNoShow] Job failed:", error);
    return {
      success: false,
      processedCount,
      markedAsNoShow,
      errors: [error.message],
    };
  }
}

/**
 * Express endpoint to manually trigger the job (for testing)
 * GET /api/jobs/auto-no-show
 */
export async function triggerAutoNoShowJob(req: any, res: any) {
  try {
    // Only allow ADMIN to manually trigger
    const { RoleCode } = await import("../constant/role");
    if (req.user?.roleId !== RoleCode.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "ONLY_ADMIN_CAN_TRIGGER_JOB",
      });
    }

    const result = await runAutoNoShowJob();

    return res.json({
      success: true,
      message: "Auto no-show job completed",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to run auto no-show job",
    });
  }
}
