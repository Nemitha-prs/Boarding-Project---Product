// Email service for sending OTP codes

import nodemailer from "nodemailer";
import { ENV } from "../env";

/**
 * Create and verify Nodemailer transporter
 * Throws error if env vars are missing or verification fails
 */
async function createTransporter() {
  // Validate required env variables
  if (!ENV.EMAIL_USER) {
    throw new Error("EMAIL_USER environment variable is required");
  }
  if (!ENV.EMAIL_PASSWORD) {
    throw new Error("EMAIL_PASSWORD environment variable is required");
  }

  // Create transporter using Gmail service
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: ENV.EMAIL_USER,
      pass: ENV.EMAIL_PASSWORD,
    },
  });

  // Verify transporter configuration
  try {
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");
  } catch (error: any) {
    console.error("❌ Email transporter verification failed:", error);
    throw new Error(`Email transporter verification failed: ${error.message}`);
  }

  return transporter;
}

/**
 * Send OTP code via email
 * Simple plain text email as required
 */
export async function sendEmailOTP(email: string, otp: string, name: string): Promise<void> {
  // Validate env variables exist
  if (!ENV.EMAIL_USER || !ENV.EMAIL_PASSWORD) {
    const missing = [];
    if (!ENV.EMAIL_USER) missing.push("EMAIL_USER");
    if (!ENV.EMAIL_PASSWORD) missing.push("EMAIL_PASSWORD");
    throw new Error(`Missing required email environment variables: ${missing.join(", ")}`);
  }

  // Create and verify transporter
  const transporter = await createTransporter();

  // Simple email content - plain text only
  const mailOptions = {
    from: ENV.EMAIL_FROM || ENV.EMAIL_USER,
    to: email,
    subject: "Your verification code",
    text: `Your OTP is: ${otp}`,
  };

  // Send email
  try {
    console.log(`📧 Sending OTP email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}. MessageId: ${info.messageId}`);
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    console.error("   Error details:", error.message);
    console.error("   Error code:", error.code);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}




