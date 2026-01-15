

import { AppointmentStatus } from "../constant/appointment";
import { VisitStatus } from "../models/Visit";


export class AppointmentStateMachine {
  private static readonly validTransitions: Record<
    AppointmentStatus,
    AppointmentStatus[]
  > = {
    [AppointmentStatus.WAITING]: [
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ],
    [AppointmentStatus.CHECKED_IN]: [
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.NO_SHOW,
    ],
    [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
    [AppointmentStatus.COMPLETED]: [], 
    [AppointmentStatus.CANCELLED]: [], 
    [AppointmentStatus.NO_SHOW]: [], 
  };

  
  static canTransition(
    from: AppointmentStatus,
    to: AppointmentStatus
  ): boolean {
    if (from === to) return true; 
    const allowedTransitions = this.validTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  
  static validateTransition(
    from: AppointmentStatus,
    to: AppointmentStatus
  ): void {
    if (from === to) return; 

    if (!this.canTransition(from, to)) {
      throw new Error(
        `INVALID_APPOINTMENT_STATE_TRANSITION: Cannot transition from ${from} to ${to}`
      );
    }
  }

  
  static isTerminal(status: AppointmentStatus): boolean {
    return (
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.NO_SHOW
    );
  }

  
  static getValidNextStates(
    current: AppointmentStatus
  ): AppointmentStatus[] {
    return this.validTransitions[current] || [];
  }
}


export class VisitStateMachine {
  private static readonly validTransitions: Record<
    VisitStatus,
    VisitStatus[]
  > = {
    WAITING: ["EXAMINING", "EXAMINED", "CANCELLED"],
    EXAMINING: ["EXAMINED", "CANCELLED"],
    EXAMINED: ["COMPLETED"],
    COMPLETED: [], 
    CANCELLED: [], 
  };

  
  static canTransition(from: VisitStatus, to: VisitStatus): boolean {
    if (from === to) return true; 
    const allowedTransitions = this.validTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  
  static validateTransition(from: VisitStatus, to: VisitStatus): void {
    if (from === to) return; 

    if (!this.canTransition(from, to)) {
      throw new Error(
        `INVALID_VISIT_STATE_TRANSITION: Cannot transition from ${from} to ${to}`
      );
    }
  }

  
  static isTerminal(status: VisitStatus): boolean {
    return status === "COMPLETED" || status === "CANCELLED";
  }

  
  static getValidNextStates(current: VisitStatus): VisitStatus[] {
    return this.validTransitions[current] || [];
  }

  
  static validateNotCompleted(status: VisitStatus): void {
    if (status === "COMPLETED") {
      throw new Error("CANNOT_MODIFY_COMPLETED_VISIT");
    }
  }

  
  static validateNotCancelled(status: VisitStatus): void {
    if (status === "CANCELLED") {
      throw new Error("CANNOT_MODIFY_CANCELLED_VISIT");
    }
  }
}
