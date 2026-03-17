import { Resend } from "resend";
import config from "../config";
import logger from "../utils/logger";
import { InternalServerError } from "../utils/errors";

const resend = new Resend(config.resend.RESEND_API_KEY);

class EmailService {
  constructor() {}

  /**
   * Send email verification OTP
   */
  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    try {
      await resend.emails.send({
        from: config.email.from,
        to: email,
        subject: "Verify Your Email Address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Thank you for registering! Please use the following code to verify your email address:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in ${config.otp.expiryMinutes} minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error("Failed to send verification email:", error);
      throw new InternalServerError("Failed to send verification email");
    }
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetEmail(email: string, otp: string): Promise<void> {
    try {
      await resend.emails.send({
        from: config.email.from,
        to: email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>We received a request to reset your password. Use the following code:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in ${config.otp.expiryMinutes} minutes.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        `,
      });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error("Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    try {
      await resend.emails.send({
        from: config.email.from,
        to: email,
        subject: "Welcome to Our Platform!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome, ${username}!</h2>
            <p>Your email has been successfully verified. You can now enjoy all the features of our platform.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
        `,
      });
      logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      logger.error("Failed to send welcome email:", error);
      // Don't throw error for welcome email failure
    }
  }
}

export default new EmailService();
