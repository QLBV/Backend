import { RoleCode } from "../constant/role";
import Patient from "../models/Patient";


export interface JwtUserPayload {
  userId: number;
  roleId: RoleCode;
  patientId?: number | null;
  doctorId?: number | null;
}


declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      patientData?: Patient;
    }
  }
}
