/**
 * @fileoverview SMS handling utility using Twilio service
 * Provides functionality to send text messages to phone numbers
 */
import { Twilio } from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Twilio client instance initialized with credentials from environment variables
 */
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT as string,
  process.env.TWILIO_AUTH_TOKEN as string
);

/**
 * Sends an SMS message to the specified phone number
 *
 * @param options - Object containing SMS sending options
 * @param options.phoneTo - Recipient's phone number (should include country code)
 * @param options.message - The text message content to be sent
 * @returns Promise that resolves when the message is sent successfully
 * @throws Will throw an error if the message cannot be sent
 */
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
