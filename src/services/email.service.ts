import nodemailer, { Transporter } from "nodemailer";


export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}


class EmailService {
  private transporter!: Transporter;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = false;
    this.initializeTransporter();
  }

  
  private initializeTransporter() {
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

    
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
      console.warn(
        "️  Email credentials not configured. Email service will be disabled."
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT, 10),
        secure: parseInt(EMAIL_PORT, 10) === 465, 
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      });

      this.isConfigured = true;
      console.log(" Email service initialized successfully");
    } catch (error) {
      console.error(" Failed to initialize email service:", error);
    }
  }

  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn("Email service not configured. Skipping email send.");
      return false;
    }

    try {
      const { to, subject, html, text } = options;

      const info = await this.transporter.sendMail({
        from: `"Hệ thống Phòng khám" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        text: text || this.stripHtml(html), 
      });

      console.log(` Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(" Failed to send email:", error);
      return false;
    }
  }

  
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "");
  }

  
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log(" Email server connection verified");
      return true;
    } catch (error) {
      console.error(" Email server connection failed:", error);
      return false;
    }
  }
}


export const emailService = new EmailService();


export async function sendEmail(options: EmailOptions): Promise<boolean> {
  return emailService.sendEmail(options);
}
