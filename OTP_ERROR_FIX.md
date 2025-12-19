# OTP Generation Error Fix

## Error: "Failed to generate verification code. Please try again."

This error occurs when the `upsertOTP` function fails to store the OTP in the database.

## Most Common Causes:

### 1. Missing `email_otps` Table (MOST LIKELY)
The `email_otps` table doesn't exist in your Supabase database.

**Solution:**
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the migration script: `backend/migrations/create_email_otps_table.sql`

The table should have this structure:
```sql
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
```

### 2. Missing Email Credentials (Development Mode)
If `EMAIL_USER` or `EMAIL_PASSWORD` are not set, the OTP will be logged to console instead of sent via email. This is now handled gracefully.

**Solution:**
- For development: OTP will be logged to console (no action needed)
- For production: Set `EMAIL_USER` and `EMAIL_PASSWORD` in your `.env` file

### 3. Database Connection Issues
Supabase connection might be failing.

**Solution:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct in `.env`
- Check Supabase dashboard for connection status

## Changes Made:

1. ✅ **Improved Error Messages**: More specific error messages to identify the exact issue
2. ✅ **Development Fallback**: If email credentials are missing, OTP is logged to console instead of failing
3. ✅ **Better Database Error Handling**: Specific error messages for missing tables, constraint violations, etc.

## Testing:

1. **Check if table exists:**
   ```sql
   SELECT * FROM email_otps LIMIT 1;
   ```

2. **If table doesn't exist, create it:**
   - Run `backend/migrations/create_email_otps_table.sql` in Supabase SQL Editor

3. **Test OTP generation:**
   - Try signing up with a new email
   - Check backend console for error messages
   - If email credentials are missing, OTP will be logged to console

## Next Steps:

1. Run the migration script in Supabase
2. Restart the backend server
3. Try signing up again
4. Check the backend console logs for detailed error messages

