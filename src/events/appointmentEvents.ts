import { EventEmitter } from "events";
import {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendDoctorChangeNotification,
} from "../modules/notification/notification.service";

class AppointmentEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }


  private setupListeners() {
    
    this.on("appointment:created", async (appointmentId: number) => {
      console.log(` Event: appointment:created - ID: ${appointmentId}`);
      try {
        await sendAppointmentConfirmation(appointmentId);
      } catch (error) {
        console.error(
          `Failed to send appointment confirmation for ${appointmentId}:`,
          error
        );
      }
    });

    this.on(
      "appointment:cancelled",
      async (data: { appointmentId: number; reason?: string }) => {
        console.log(
          ` Event: appointment:cancelled - ID: ${data.appointmentId}`
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
  
    this.on(
      "appointment:doctor_changed",
      async (data: {
        appointmentId: number;
        oldDoctorId: number;
        newDoctorId: number;
        reason?: string;
      }) => {
        console.log(
          ` Event: appointment:doctor_changed - ID: ${data.appointmentId}`
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

  emitAppointmentCreated(appointmentId: number) {
    this.emit("appointment:created", appointmentId);
  }
  
  emitAppointmentCancelled(appointmentId: number, reason?: string) {
    this.emit("appointment:cancelled", { appointmentId, reason });
  }

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

export const appointmentEvents = new AppointmentEventEmitter();
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
