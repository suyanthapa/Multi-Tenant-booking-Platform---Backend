import bcrypt from "bcrypt";
import config from "../config";

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, config.bcrypt.saltRounds);
};

/**
 * Compare plain password with hashed password
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate a random OTP code
 */
export const generateOTP = (length: number = config.otp.length): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Hash OTP for secure storage
 */
export const hashOTP = async (otp: string): Promise<string> => {
  return await bcrypt.hash(otp, 10);
};

/**
 * Verify OTP against hash
 */
export const verifyOTP = async (
  otp: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(otp, hash);
};
