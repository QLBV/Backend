import bcrypt from "bcryptjs";

/**
 * Hash password trước khi lưu DB
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
};

/**
 * So sánh password khi login
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
