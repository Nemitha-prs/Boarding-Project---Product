-- Create email_otps table for production-ready OTP system
-- This replaces in-memory OTP storage with persistent database storage

CREATE TABLE IF NOT EXISTS email_otps (
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('register', 'forgot_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (email, purpose)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose ON email_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

