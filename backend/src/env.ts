import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const ENV = {
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_SERVICE_KEY: required("SUPABASE_SERVICE_KEY"),
  JWT_SECRET: required("JWT_SECRET"),
  PORT: Number(process.env.PORT || 4000),
  API_URL: process.env.API_URL || "http://localhost:4000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  // Email (optional - for development, OTPs will be logged to console)
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  // SMS/Twilio (optional - for development, OTPs will be logged to console)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",
};
