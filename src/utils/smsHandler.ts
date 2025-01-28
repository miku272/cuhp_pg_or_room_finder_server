import { Twilio } from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

export const sendSMS = async (options: {
  phoneTo: string;
  message: string;
}): Promise<void> => {
  await twilioClient.messages.create({
    body: options.message,
    from: process.env.TWILIO_PHONE_NUMBER as string,
    to: options.phoneTo,
  });
};
