import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
