/**
 * State Machine Validation for Appointment and Visit
 * Enforces valid state transitions and prevents illegal operations
 */

import { AppointmentStatus } from "../constant/appointment";
import { VisitStatus } from "../models/Visit";

/**
 * Appointment State Machine
 *
 * Valid transitions:
 * WAITING -> CHECKED_IN (check-in)
 * WAITING -> CANCELLED (cancel)
 * WAITING -> NO_SHOW (no-show)
 * CHECKED_IN -> IN_PROGRESS (start examination)
 * CHECKED_IN -> NO_SHOW (patient left before examination)
 * IN_PROGRESS -> COMPLETED (payment completed)
 *
 * Terminal states (no transitions allowed):
 * - COMPLETED
 * - CANCELLED
 * - NO_SHOW
 */
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
    [AppointmentStatus.COMPLETED]: [], // Terminal state
    [AppointmentStatus.CANCELLED]: [], // Terminal state
    [AppointmentStatus.NO_SHOW]: [], // Terminal state
  };

  /**
   * Check if a state transition is valid
   */
  static canTransition(
    from: AppointmentStatus,
    to: AppointmentStatus
  ): boolean {
    if (from === to) return true; // No change
    const allowedTransitions = this.validTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * Validate a state transition, throw error if invalid
   */
  static validateTransition(
    from: AppointmentStatus,
    to: AppointmentStatus
  ): void {
    if (from === to) return; // No change is always valid

    if (!this.canTransition(from, to)) {
      throw new Error(
        `INVALID_APPOINTMENT_STATE_TRANSITION: Cannot transition from ${from} to ${to}`
      );
    }
  }

  /**
   * Check if a status is terminal (no further transitions allowed)
   */
  static isTerminal(status: AppointmentStatus): boolean {
    return (
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.NO_SHOW
    );
  }

  /**
   * Get all valid next states from current state
   */
  static getValidNextStates(
    current: AppointmentStatus
  ): AppointmentStatus[] {
    return this.validTransitions[current] || [];
  }
}

/**
 * Visit State Machine
 *
 * Valid transitions:
 * EXAMINING -> EXAMINED (doctor saves diagnosis)
 * EXAMINED -> COMPLETED (payment completed)
 * EXAMINING -> CANCELLED (patient left, visit cancelled)
 *
 * Terminal states (no transitions allowed):
 * - COMPLETED
 * - CANCELLED
 */
export class VisitStateMachine {
  private static readonly validTransitions: Record<
    VisitStatus,
    VisitStatus[]
  > = {
    EXAMINING: ["EXAMINED", "CANCELLED"],
    EXAMINED: ["COMPLETED"],
    COMPLETED: [], // Terminal state - immutable
    CANCELLED: [], // Terminal state
  };

  /**
   * Check if a state transition is valid
   */
  static canTransition(from: VisitStatus, to: VisitStatus): boolean {
    if (from === to) return true; // No change
    const allowedTransitions = this.validTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * Validate a state transition, throw error if invalid
   */
  static validateTransition(from: VisitStatus, to: VisitStatus): void {
    if (from === to) return; // No change is always valid

    if (!this.canTransition(from, to)) {
      throw new Error(
        `INVALID_VISIT_STATE_TRANSITION: Cannot transition from ${from} to ${to}`
      );
    }
  }

  /**
   * Check if a status is terminal (no further transitions allowed)
   */
  static isTerminal(status: VisitStatus): boolean {
    return status === "COMPLETED" || status === "CANCELLED";
  }

  /**
   * Get all valid next states from current state
   */
  static getValidNextStates(current: VisitStatus): VisitStatus[] {
    return this.validTransitions[current] || [];
  }

  /**
   * CRITICAL: Validate that a visit is not completed before allowing updates
   */
  static validateNotCompleted(status: VisitStatus): void {
    if (status === "COMPLETED") {
      throw new Error("CANNOT_MODIFY_COMPLETED_VISIT");
    }
  }

  /**
   * CRITICAL: Validate that a visit is not cancelled before allowing updates
   */
  static validateNotCancelled(status: VisitStatus): void {
    if (status === "CANCELLED") {
      throw new Error("CANNOT_MODIFY_CANCELLED_VISIT");
    }
  }
}
