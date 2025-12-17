# Render Environment Variables Setup

> **CRITICAL**: The frontend is unable to initiate Google OAuth login because `VITE_GOOGLE_CLIENT_ID` is not configured in Render.

## Problem

The app has two types of environment variables:

1. **Server-side** (Node.js) - Can access regular `GOOGLE_CLIENT_ID`
2. **Browser/Frontend** (React) - Can ONLY access variables prefixed with `VITE_`

The Render deployment is missing the **`VITE_GOOGLE_CLIENT_ID`** variable that the frontend needs to generate the Google OAuth login URL.

## Solution: Add Missing VITE_ Environment Variables to Render

### Step 1: Go to Render Dashboard
1. Navigate to https://dashboard.render.com
2. Select your service: **orcestra-dicom-app**
3. Go to **Settings** → **Environment**

### Step 2: Add the Following Environment Variables

> **Copy-paste each exact variable name and value:**

#### Frontend OAuth Variables (REQUIRED)
```
VITE_GOOGLE_CLIENT_ID = 214977543278-bvcpg5utb181ba3kc7g41m351ecks7up.apps.googleusercontent.com
```

#### Frontend Manus OAuth Variables (Optional but recommended)
```
VITE_OAUTH_PORTAL_URL = https://api.manus.im
VITE_APP_ID = orcestra-dicom-app
```

#### Frontend Optional Analytics (Optional)
```
VITE_FRONTEND_FORGE_API_KEY = [leave empty or set if you have one]
VITE_FRONTEND_FORGE_API_URL = [leave empty or set if you have one]
VITE_ANALYTICS_ENDPOINT = [leave empty if not using analytics]
VITE_ANALYTICS_WEBSITE_ID = [leave empty if not using analytics]
```

### Step 3: Deploy

After adding the variables:
1. Click **Save**
2. Render will automatically **trigger a new build**
3. Wait for deployment to complete (~3-5 minutes)

### Step 4: Test

1. Go to https://orcestra-dicom-app.onrender.com
2. Try **"Login with Google"** button
3. You should now see Google's OAuth login screen

## Why This Works

- **Vite build process** scans for `VITE_*` environment variables during build time
- These variables are embedded into the **JavaScript bundle**
- The browser can then access them via `import.meta.env.VITE_*`
- Regular variables like `GOOGLE_CLIENT_ID` are server-only and inaccessible to the frontend

## Environment Variable Reference

| Variable | Type | Location | Purpose |
|----------|------|----------|---------|
| `DATABASE_URL` | Server | Backend | PostgreSQL connection |
| `GOOGLE_CLIENT_ID` | Server | Backend | Verify JWT tokens from Google |
| `GOOGLE_CLIENT_SECRET` | Server | Backend | OAuth token exchange |
| `GOOGLE_REDIRECT_URI` | Server | Backend/Frontend | OAuth callback URL (hardcoded in render.yaml) |
| `VITE_GOOGLE_CLIENT_ID` | **Frontend** | Build time | **Generate OAuth login URL (MISSING!)** |
| `JWT_SECRET` | Server | Backend | Encrypt session tokens |
| `VITE_OAUTH_PORTAL_URL` | **Frontend** | Build time | Manus OAuth fallback |
| `VITE_APP_ID` | **Frontend** | Build time | App identifier |

## Quick Checklist

- [ ] Added `VITE_GOOGLE_CLIENT_ID` to Render environment
- [ ] Added `VITE_OAUTH_PORTAL_URL` to Render environment  
- [ ] Added `VITE_APP_ID` to Render environment
- [ ] Render triggered a new build
- [ ] Build completed successfully (check deployment logs)
- [ ] Tested Google login at https://orcestra-dicom-app.onrender.com
- [ ] Login redirects to home page after Google OAuth

## Troubleshooting

### "Google OAuth não está configurado" error in UI
- `VITE_GOOGLE_CLIENT_ID` is not set or build hasn't completed
- Check build logs in Render dashboard
- Wait for new build to complete and try again

### "redirect_uri_mismatch" error from Google
- Also need to add to Google Cloud Console: https://console.cloud.google.com/
- Add `https://orcestra-dicom-app.onrender.com/api/oauth/google/callback` to authorized redirect URIs
- See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for details

### Build failing with "variable not found"
- Environment variables are case-sensitive
- Use exactly: `VITE_GOOGLE_CLIENT_ID` (not `VITE_google_client_id`)
- Render may need 30 seconds to sync variables after saving

## Database Note

The database (PostgreSQL on Railway) is already configured and contains all tables. You don't need to run migrations.

