// OTP generation and validation service

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5; // Standard 5-minute expiry

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry(): string {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
  return expiry.toISOString();
}

/**
 * Verify OTP
 */
export function verifyOTP(inputOTP: string, storedOTP: string | null, expiresAt: string | null): boolean {
  if (!storedOTP || !inputOTP) return false;
  if (isOTPExpired(expiresAt)) return false;
  return inputOTP.trim() === storedOTP.trim();
}




