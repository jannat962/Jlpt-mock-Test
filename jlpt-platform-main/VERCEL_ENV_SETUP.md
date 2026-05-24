# Vercel Environment Variables Setup (Optional)

## Overview
The `.env.production` file is already committed with the correct API URL. However, if you prefer to use Vercel's environment variables UI instead, follow these steps.

## Method 1: Using `.env.production` (Recommended - Already Done)
✅ **Current Setup**: Uses committed `.env.production` file
- No additional steps needed
- API URL is: `https://jlpt-platform-backend.onrender.com/api`
- Works automatically on all deployments

## Method 2: Using Vercel Environment Variables UI (Optional)

### Step 1: Go to Vercel Project Settings
1. Open: https://vercel.com
2. Select your project: `jlpt-platform`
3. Go to: **Settings** → **Environment Variables**

### Step 2: Add Production Environment Variable
1. Click **"Add New"** button
2. Fill in:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://jlpt-platform-backend.onrender.com/api`
   - **Environments**: Select **Production**
3. Click **"Save"**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest production deployment
3. Wait for deployment to complete (green checkmark ✅)

---

## Verifying the Configuration

### In Browser Console (`F12` → Console)
```javascript
// Should show the API URL being used:
// [SIGNUP] Attempting signup to https://jlpt-platform-backend.onrender.com/api/auth/signup
```

### In Network Tab (`F12` → Network)
- Look for requests to `/api/auth/signup` or `/api/auth/login`
- Full URL should be: `https://jlpt-platform-backend.onrender.com/api/auth/...`

---

## If Backend URL Changes

### Update Method 1 (File-based - Current)
1. Edit `frontend/.env.production`:
   ```env
   VITE_API_URL=https://new-backend-url.com/api
   ```
2. Commit and push to GitHub
3. Vercel auto-redeploys

### Update Method 2 (Environment Variable-based)
1. Go to Vercel Settings → Environment Variables
2. Edit `VITE_API_URL` value
3. Redeploy

---

## Current Backend URL

The backend is deployed on Render:
```
https://jlpt-platform-backend.onrender.com
```

**Test it**:
```bash
curl https://jlpt-platform-backend.onrender.com/api/health
# Expected: {"status":"healthy"}
```

---

## Troubleshooting

### Issue: Environment Variable Not Applied
**Solution**: Rebuild and redeploy
```
Vercel → Deployments → Click latest → More options → Redeploy
```

### Issue: Still Getting "Processing..."
**Solution**: Check browser console for actual API URL being used
```
F12 → Console → Look for [SIGNUP] or [LOGIN] logs
```

### Issue: "Wrong Origin" or CORS Error
**Solution**: Verify backend CORS includes Vercel URL
```
Backend check: https://jlpt-platform-backend.onrender.com/api/health
Should respond without CORS errors
```

---

## Recommendation

✅ **Keep using `.env.production`** (current setup)
- Simpler to maintain in version control
- No manual Vercel UI steps needed
- Automatically applies to all deployments
- Easy to change: just edit file and push

