# Environment Variables Setup

## Backend Environment Variables

Create a `.env` file in the `Backend` directory with the following variables:

### Required Variables

```env
# Supabase Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=4000
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

### Google OAuth (Required for Google Sign-in)

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
```

**How to get Google OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set Application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:4000/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
7. Copy the Client ID and Client Secret to your `.env` file

### Email Service (Optional - for production)

For development, OTPs will be logged to the console. For production, configure email:

```env
# Email Configuration (Gmail example)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password  # Use App Password, not regular password
EMAIL_SERVICE=gmail
EMAIL_FROM=your_email@gmail.com
```

**Gmail App Password setup:**
1. Enable 2-Step Verification on your Google account
2. Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Use this 16-character password in `EMAIL_PASSWORD`

### SMS Service (Optional - for production)

For development, OTPs will be logged to the console. For production, configure Twilio:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**Twilio setup:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Get a phone number from Twilio
4. Add these to your `.env` file

## Frontend Environment Variables

Create a `.env.local` file in the `Frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For production, update to your production API URL:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Important Notes

1. **Never commit `.env` files to Git** - They contain sensitive information
2. The `.env` file should be in `.gitignore`
3. For production, set these variables in your hosting platform's environment settings
4. Make sure `GOOGLE_CALLBACK_URL` matches exactly what you configured in Google Cloud Console



