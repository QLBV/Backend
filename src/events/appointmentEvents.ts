import { EventEmitter } from "events";
import {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendDoctorChangeNotification,
} from "../services/notification.service";

/**
 * Event Bus cho appointment-related events
 */
class AppointmentEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Thiết lập các listeners
   */
  private setupListeners() {
    // Listener: Khi tạo lịch hẹn mới
    this.on("appointment:created", async (appointmentId: number) => {
      console.log(`📧 Event: appointment:created - ID: ${appointmentId}`);
      try {
        await sendAppointmentConfirmation(appointmentId);
      } catch (error) {
        console.error(
          `Failed to send appointment confirmation for ${appointmentId}:`,
          error
        );
      }
    });

    // Listener: Khi hủy lịch hẹn
    this.on(
      "appointment:cancelled",
      async (data: { appointmentId: number; reason?: string }) => {
        console.log(
          `📧 Event: appointment:cancelled - ID: ${data.appointmentId}`
        );
        try {
          await sendAppointmentCancellation(data.appointmentId, data.reason);
        } catch (error) {
          console.error(
            `Failed to send cancellation notification for ${data.appointmentId}:`,
            error
          );
        }
      }
    );

    // Listener: Khi đổi bác sĩ
    this.on(
      "appointment:doctor_changed",
      async (data: {
        appointmentId: number;
        oldDoctorId: number;
        newDoctorId: number;
        reason?: string;
      }) => {
        console.log(
          `📧 Event: appointment:doctor_changed - ID: ${data.appointmentId}`
        );
        try {
          await sendDoctorChangeNotification(
            data.appointmentId,
            data.oldDoctorId,
            data.newDoctorId,
            data.reason
          );
        } catch (error) {
          console.error(
            `Failed to send doctor change notification for ${data.appointmentId}:`,
            error
          );
        }
      }
    );
  }

  /**
   * Emit event tạo lịch hẹn mới
   */
  emitAppointmentCreated(appointmentId: number) {
    this.emit("appointment:created", appointmentId);
  }

  /**
   * Emit event hủy lịch hẹn
   */
  emitAppointmentCancelled(appointmentId: number, reason?: string) {
    this.emit("appointment:cancelled", { appointmentId, reason });
  }

  /**
   * Emit event đổi bác sĩ
   */
  emitDoctorChanged(
    appointmentId: number,
    oldDoctorId: number,
    newDoctorId: number,
    reason?: string
  ) {
    this.emit("appointment:doctor_changed", {
      appointmentId,
      oldDoctorId,
      newDoctorId,
      reason,
    });
  }
}

// Export singleton instance
export const appointmentEvents = new AppointmentEventEmitter();

// Export helper functions
export function notifyAppointmentCreated(appointmentId: number) {
  appointmentEvents.emitAppointmentCreated(appointmentId);
}

export function notifyAppointmentCancelled(
  appointmentId: number,
  reason?: string
) {
  appointmentEvents.emitAppointmentCancelled(appointmentId, reason);
}

export function notifyDoctorChanged(
  appointmentId: number,
  oldDoctorId: number,
  newDoctorId: number,
  reason?: string
) {
  appointmentEvents.emitDoctorChanged(
    appointmentId,
    oldDoctorId,
    newDoctorId,
    reason
  );
}
