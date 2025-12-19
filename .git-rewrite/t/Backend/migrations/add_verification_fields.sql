-- Migration: Add verification fields to users table
-- Run this in your Supabase SQL editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS emailVerified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phoneVerified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emailOtp TEXT,
ADD COLUMN IF NOT EXISTS phoneOtp TEXT,
ADD COLUMN IF NOT EXISTS emailOtpExpiresAt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS phoneOtpExpiresAt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS googleId TEXT;

-- Create index on googleId for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(googleId);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);




