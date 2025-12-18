# Google OAuth Setup Guide

## Step 1: Create a Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or **Google Identity API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application** as the application type
6. Configure the OAuth consent screen if prompted

## Step 2: Configure OAuth Client

1. **Authorized JavaScript origins:**
   - `http://localhost:4000` (for development)
   - `https://your-production-domain.com` (for production)

2. **Authorized redirect URIs (CRITICAL - Must match exactly!):**
   - `http://localhost:4000/auth/google/callback` (for development)
   - `https://your-production-domain.com/auth/google/callback` (for production)
   
   **⚠️ IMPORTANT:** The redirect URI must match EXACTLY, including:
   - Protocol (`http://` vs `https://`)
   - Domain/hostname
   - Port number (if using non-standard port)
   - Path (`/auth/google/callback`)
   
   **To find your exact callback URL:**
   - Start your backend server
   - Visit: `http://localhost:4000/auth/google/debug`
   - Copy the `callbackURL` value shown
   - Add it to Google Cloud Console

## Step 3: Get Your Credentials

After creating the OAuth client, you'll receive:
- **Client ID** (e.g., `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Client Secret** (e.g., `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

## Step 4: Add to Environment Variables

Create a `.env` file in the `Backend` directory and add:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

**Important Notes:**
- `GOOGLE_CALLBACK_URL` is optional - if not set, it defaults to `${API_URL}/auth/google/callback`
- The callback URL must match EXACTLY what you configured in Google Cloud Console
- For production, update both `GOOGLE_CALLBACK_URL` and `API_URL` to your production API URL
- Never commit your `.env` file to version control (it should be in `.gitignore`)

## Step 5: Verify Setup

1. Start your backend server: `npm run dev`
2. Try signing up/login with Google on the frontend
3. You should be redirected to Google's consent screen
4. After approval, you'll be redirected back to your app

## Troubleshooting

### Error: redirect_uri_mismatch

This is the most common error. It means the callback URL doesn't match what's in Google Cloud Console.

**Solution:**
1. Start your backend server: `npm run dev`
2. Visit the debug endpoint: `http://localhost:4000/auth/google/debug`
3. Copy the `callbackURL` value shown
4. Go to [Google Cloud Console](https://console.cloud.google.com/)
5. Navigate to: **APIs & Services** → **Credentials**
6. Click on your OAuth 2.0 Client ID
7. Under "Authorized redirect URIs", add the exact `callbackURL` from step 3
8. Click **Save**
9. Wait 1-2 minutes for changes to propagate
10. Try again

**Common mistakes:**
- Using `https://` when you should use `http://` (or vice versa)
- Missing or incorrect port number
- Extra trailing slashes
- Wrong path (should be `/auth/google/callback`)

### Error: invalid_client

- Check that your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` are correct
- Make sure there are no extra spaces or quotes around the values
- Verify the credentials in Google Cloud Console

### Error: invalid_grant

- The token may have expired - try signing in again
- Clear your browser cookies and try again
- Check if your Google account has been disabled

### CORS errors

- Ensure your frontend URL is added to "Authorized JavaScript origins" in Google Cloud Console
- Check that `FRONTEND_URL` in your `.env` matches your actual frontend URL

### Debug Your Configuration

Visit `http://localhost:4000/auth/google/debug` to see:
- Your configured callback URL
- Whether OAuth credentials are set
- Step-by-step instructions

