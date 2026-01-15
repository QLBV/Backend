import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import Shift from "../models/Shift";
import { BOOKING_CONFIG } from "../config/booking.config";

function calculateAppointmentTime(
  date: Date,
  shiftStartTime: string,
  slotNumber: number
): Date {
  const [hours, minutes] = shiftStartTime.split(":").map(Number);
  const appointmentTime = new Date(date);
  appointmentTime.setHours(hours, minutes, 0, 0);

  const minutesToAdd = (slotNumber - 1) * BOOKING_CONFIG.SLOT_MINUTES;
  appointmentTime.setMinutes(appointmentTime.getMinutes() + minutesToAdd);

  return appointmentTime;
}

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const appointments = await Appointment.findAll({
      where: {
        status: "WAITING",
        date: {
          [Op.gte]: yesterday, 
          [Op.lte]: today, 
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

    const now = new Date();
    const NO_SHOW_THRESHOLD_MINUTES = 30; 

    for (const appointment of appointments) {
      processedCount++;

      try {
        const shift = (appointment as any).shift;
        if (!shift) {
          errors.push(`Appointment ${appointment.id}: Shift not found`);
          continue;
        }

        const appointmentTime = calculateAppointmentTime(
          new Date(appointment.date),
          shift.startTime,
          appointment.slotNumber
        );

        const noShowDeadline = new Date(
          appointmentTime.getTime() + NO_SHOW_THRESHOLD_MINUTES * 60 * 1000
        );

        
        if (now > noShowDeadline) {
          await appointment.update({ status: "NO_SHOW" });

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

export async function triggerAutoNoShowJob(req: any, res: any) {
  try {
    
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
