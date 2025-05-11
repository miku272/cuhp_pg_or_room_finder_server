/**
 * @fileoverview Email handling utility using Nodemailer
 * Provides functionality to send emails to users
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Nodemailer transporter configured with SMTP settings from environment variables
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Sends an email to the specified recipient
 *
 * @param options - Object containing email sending options
 * @param options.emailTo - Recipient's email address
 * @param options.subject - Email subject line
 * @param options.message - Plain text message content
 * @param options.html - Optional HTML content (if not provided, message is used)
 * @returns Promise that resolves when the email is sent successfully
 * @throws Will throw an error if the email cannot be sent
 */
export const sendEmail = async (options: {
  emailTo: string;
  subject: undefined | string;
  message: string;
  html?: undefined | string;
}): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.emailTo,
    subject: options.subject,
    text: options.message,
    html: options.html ?? options.message ?? '',
  };

  await transporter.sendMail(mailOptions);
};
