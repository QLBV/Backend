import crypto from "crypto";



export interface OTPData {
  code: string;
  expiresAt: Date;
}

export class OTPService {
  
  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  
  static generateToken(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  
  static verifyOTP(otp: string, storedHash: string): boolean {
    const inputHash = this.generateToken(otp);
    return inputHash === storedHash;
  }

  
  static isExpired(expiresAt: Date): boolean {
    return new Date() > new Date(expiresAt);
  }

  
  static getExpirationTime(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    return expiresAt;
  }
}
