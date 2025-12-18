# Frontend Environment Variables

This document lists all environment variables required for hosting the AnexLK frontend application.

## Required Environment Variables

### 1. `NEXT_PUBLIC_API_URL`
**Description:** Base URL for the backend API server  
**Required:** Yes  
**Example:** `https://api.anexlk.com` or `http://localhost:4000`  
**Used in:** `Frontend/lib/auth.ts`  
**Default:** `http://localhost:4000` (development only)

**Production Example:**
```env
NEXT_PUBLIC_API_URL=https://api.anexlk.com
```

---

### 2. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
**Description:** Google Maps API key for map functionality  
**Required:** Yes (for map features to work)  
**Example:** `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`  
**Used in:**
- `Frontend/components/BoardingLocationMap.tsx`
- `Frontend/components/SingleBoardingMap.tsx`
- `Frontend/components/MapView.tsx`

**How to get:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing one
3. Enable "Maps JavaScript API"
4. Create credentials (API Key)
5. Restrict the API key to your domain (recommended)

**Production Example:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3. `NEXT_PUBLIC_SITE_URL`
**Description:** Public URL of your frontend application  
**Required:** Recommended (for SEO and sitemap)  
**Example:** `https://anexlk.com` or `https://www.anexlk.com`  
**Used in:**
- `Frontend/app/sitemap.ts`
- `Frontend/app/robots.ts`
**Default:** `http://localhost:3000` (development only)

**Production Example:**
```env
NEXT_PUBLIC_SITE_URL=https://anexlk.com
```

---

## Environment File Setup

### For Development
Create a `.env.local` file in the `Frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### For Production
Set these environment variables in your hosting platform:

**Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with the `NEXT_PUBLIC_` prefix

**Netlify:**
1. Go to Site settings
2. Navigate to "Environment variables"
3. Add each variable

**Other Platforms:**
- Set environment variables in your hosting platform's dashboard
- Ensure variables with `NEXT_PUBLIC_` prefix are exposed to the browser

---

## Important Notes

### 1. `NEXT_PUBLIC_` Prefix
- All frontend environment variables **must** start with `NEXT_PUBLIC_`
- This prefix makes variables accessible in the browser
- Variables without this prefix are only available server-side

### 2. Security
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` will be visible in the browser
- Restrict your Google Maps API key to your domain in Google Cloud Console
- Never commit `.env.local` files to Git (already in `.gitignore`)

### 3. API URL
- Must be the full URL including protocol (`https://` or `http://`)
- No trailing slash
- Must be accessible from the browser (CORS configured on backend)

### 4. Site URL
- Should match your actual domain
- Used for SEO (sitemap, robots.txt)
- Should use `https://` in production

---

## Quick Setup Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` to your backend API URL
- [ ] Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with your Google Maps API key
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your frontend domain
- [ ] Verify backend CORS allows requests from your frontend domain
- [ ] Restrict Google Maps API key to your domain
- [ ] Test map functionality after deployment
- [ ] Verify API calls work from the frontend

---

## Example Production Configuration

```env
# Production Environment Variables
NEXT_PUBLIC_API_URL=https://api.anexlk.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://anexlk.com
```

---

## Troubleshooting

### Maps not loading?
- Check if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
- Verify the API key is enabled in Google Cloud Console
- Check browser console for API key errors
- Ensure Maps JavaScript API is enabled

### API calls failing?
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS configuration
- Ensure backend is accessible from your frontend domain
- Check browser network tab for errors

### Sitemap/robots.txt issues?
- Verify `NEXT_PUBLIC_SITE_URL` matches your actual domain
- Check that the URL uses `https://` in production

