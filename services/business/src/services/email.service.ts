import nodemailer from "nodemailer";
import config from "../config";
import logger from "../utils/logger";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    try {
      await this.transporter.sendMail({
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

  async sendBusinessApprovalEmail(
    email: string,
    businessName: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: "Your Business Has Been Approved! 🎉",
      html: `
     <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #2563eb; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Slotex!</h1>
    </div>

    <div style="padding: 40px 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Congratulations, ${businessName}!</h2>
        <p style="font-size: 16px;">We are pleased to inform you that your business application has been <strong>officially approved</strong> by our administration team.</p>
        
        <p style="font-size: 16px;">Your dashboard is now fully unlocked. You can begin setting up your profile, managing listings, and connecting with customers.</p>

        

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

        <h3 style="font-size: 18px; color: #1e293b;">Next Steps:</h3>
        <ul style="padding-left: 20px; font-size: 15px; color: #475569;">
            <li style="margin-bottom: 10px;">Complete your business profile details.</li>
            <li style="margin-bottom: 10px;">Upload high-quality images of your services.</li>
            <li style="margin-bottom: 10px;">Review our "Getting Started" guide in the help section.</li>
        </ul>
    </div>

    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0;">&copy; 2026 Slotex Platform. All rights reserved.</p>
        <p style="margin: 5px 0;">This is an automated message. Please do not reply to this email.</p>
    </div>
</div>
    `,
    });
  }
}

export default new EmailService();
