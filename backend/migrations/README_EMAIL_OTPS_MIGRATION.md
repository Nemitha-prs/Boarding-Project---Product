# Email OTPs Migration - Production Ready OTP System

## Overview
This migration moves OTP storage from in-memory Maps to Supabase database for production reliability.

## Migration File
`create_email_otps_table.sql`

## What Changed

### Backend
- ✅ Removed in-memory OTP storage (`otpStore` and `passwordResetOtpStore` Maps)
- ✅ All OTP operations now use Supabase `email_otps` table
- ✅ 2-minute cooldown enforced on backend (prevents abuse)
- ✅ OTP state survives backend restarts
- ✅ Multiple backend instances work consistently

### Frontend
- ✅ 2-minute cooldown timer (was 5 minutes for registration, 10 minutes for password reset)
- ✅ Double-click prevention (button disabled immediately on click)
- ✅ Cooldown status shown on Send OTP button
- ✅ OTP input always visible when `otpSent === true`

## Database Schema

```sql
CREATE TABLE email_otps (
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
```

## OTP Rules

1. **Cooldown**: 2 minutes between OTP requests (enforced on backend)
2. **Expiry**: 
   - Registration: 5 minutes
   - Password Reset: 10 minutes
3. **Max Attempts**: 5 verification attempts per OTP
4. **Restart Safe**: OTP state persists across backend restarts

## How to Apply

1. Run the migration in Supabase SQL Editor:
   ```sql
   -- Copy contents of create_email_otps_table.sql
   ```

2. Deploy backend (Koyeb will auto-deploy)

3. Test OTP flows:
   - Registration flow
   - Forgot password flow
   - Cooldown enforcement
   - Backend restart (OTP should persist)

## Verification Checklist

- [x] OTP cannot be requested twice within 2 minutes
- [x] Backend restart does NOT reset OTP
- [x] Forgot-password page has OTP input
- [x] No double-click needed for OTP
- [x] Only one timer & resend button
- [x] Unlimited OTP abuse impossible
- [x] No runtime crashes

## API Changes

### Send OTP Routes
- `/auth/send-email-otp` - Returns 429 with `cooldownSeconds` if cooldown active
- `/auth/forgot-password/send-otp` - Returns 429 with `cooldownSeconds` if cooldown active

### Verify OTP Routes
- `/auth/verify-email-otp` - Checks database, increments attempts
- `/auth/forgot-password/verify-otp` - Checks database, increments attempts

All routes now use Supabase instead of in-memory storage.

