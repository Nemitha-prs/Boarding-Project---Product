// SMS service for sending OTP codes via phone

import twilio from "twilio";

// Initialize Twilio client (if credentials are provided)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send OTP code via SMS
 */
export async function sendSMSOTP(phone: string, otp: string): Promise<void> {
  // In development, log the OTP instead of sending SMS if Twilio is not configured
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log(`[DEV] SMS OTP for ${phone}: ${otp}`);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: `Your AnexLK verification code is: ${otp}. This code will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send verification SMS");
  }
}




