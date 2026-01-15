import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  if (!process.env.SMTP_USER) {
    console.warn("️ Email credentials not configured. Email skipped.");
    return;
  }

  await transporter.sendMail({
    from: `"Healthcare System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
