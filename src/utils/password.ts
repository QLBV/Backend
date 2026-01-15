import bcrypt from "bcryptjs";


export const hashPassword = async (plainPassword: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
};


export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
