import { RoleCode } from "../constant/role";
import Patient from "../models/Patient";

/**
 * Payload được decode từ JWT
 */
export interface JwtUserPayload {
  userId: number;
  roleId: RoleCode;
  patientId?: number | null;
  doctorId?: number | null;
}

/**
 * Extend Express Request
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      patientData?: Patient;
    }
  }
}
