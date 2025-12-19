-- Migration: Create atomic increment function for OTP attempts
-- Run this in your Supabase SQL editor after creating the email_otps table

CREATE OR REPLACE FUNCTION increment_otp_attempts(
  p_email TEXT,
  p_purpose TEXT
)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE email_otps
  SET 
    attempts = attempts + 1
  WHERE email = p_email AND purpose = p_purpose
  RETURNING attempts INTO new_count;
  
  IF new_count IS NULL THEN
    RAISE EXCEPTION 'OTP entry not found for email % and purpose %', p_email, p_purpose;
  END IF;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;



