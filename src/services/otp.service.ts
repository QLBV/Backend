import crypto from "crypto";

/**
 * OTP Service - Generate và verify OTP codes
 */

export interface OTPData {
  code: string;
  expiresAt: Date;
}

export class OTPService {
  /**
   * Generate OTP code (6 digits)
   */
  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Generate OTP token (for database storage)
   * @param otp - The OTP code
   * @returns Hashed token
   */
  static generateToken(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  /**
   * Verify OTP code against stored hash
   * @param otp - User input OTP
   * @param storedHash - Hash stored in database
   * @returns boolean
   */
  static verifyOTP(otp: string, storedHash: string): boolean {
    const inputHash = this.generateToken(otp);
    return inputHash === storedHash;
  }

  /**
   * Check if OTP is expired
   * @param expiresAt - Expiration date from database
   * @returns boolean
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > new Date(expiresAt);
  }

  /**
   * Get OTP expiration time (5 minutes from now)
   */
  static getExpirationTime(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    return expiresAt;
  }
}
