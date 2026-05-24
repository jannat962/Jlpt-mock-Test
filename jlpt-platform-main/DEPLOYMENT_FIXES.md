# 🔧 JLPT Platform - Sign-Up/Login Fix Guide

## Problem Summary
Sign-up and login were showing "Processing..." indefinitely on Vercel while working locally.

## Root Cause
The frontend was using a relative API URL (`/api`) which:
- ✅ Works locally via Vite proxy → `http://localhost:8000`
- ❌ Fails on Vercel without explicit backend URL configuration
- ❌ Resulted in requests being sent to `https://jlpt-platform.vercel.app/api` (404)

---

## Applied Fixes

### 1. **Frontend Environment Configuration**
✅ Created `frontend/.env.production` with explicit backend URL:
```env
VITE_API_URL=https://jlpt-platform-backend.onrender.com/api
```

This ensures the frontend always knows where the backend is on production.

### 2. **Backend CORS Fix**
✅ Fixed invalid regex pattern in `backend/app/main.py`:
```python
# Before (invalid escape sequence):
allow_origin_regex="https://jlpt-platform.*\.vercel\.app"

# After (raw string):
allow_origin_regex=r"https://jlpt-platform.*\.vercel\.app"
```

### 3. **Improved Error Handling**
✅ Enhanced frontend logging with detailed debugging info:
- Request logs with full API URL
- Response status logging
- Detailed error messages
- Open browser console (`F12`) to see debugging info

---

## Deployment Checklist

### Backend (Render)
- [ ] Verify service is **Live** (not suspended)
- [ ] Check environment variables:
  - `DATABASE_URL` (auto-linked from PostgreSQL)
  - `SECRET_KEY` (auto-generated)
  - `ALGORITHM=HS256`
  - `ACCESS_TOKEN_EXPIRE_MINUTES=30`
  - (Optional) `FRONTEND_URL=https://jlpt-platform.vercel.app`

### Frontend (Vercel)
- [ ] Verify `VITE_API_URL` is set (if using environment variable approach, optional since `.env.production` is committed)
- [ ] Check that `frontend/dist` is built correctly
- [ ] Verify `vercel.json` rewrites are in place (alternative to `.env.production`)

---

## Testing

### Test on Vercel
1. Go to: https://jlpt-platform.vercel.app
2. Open browser DevTools (`F12` → Console tab)
3. Try signing up with:
   - **Name**: Test User
   - **Role**: Learner
   - **Email**: test@example.com
   - **Password**: TestPass123!
4. Check console for logs starting with `[SIGNUP]` or `[LOGIN]`

### Expected Logs
```
[SIGNUP] Attempting signup to https://jlpt-platform-backend.onrender.com/api/auth/signup
[SIGNUP] Response status: 200 OK
[SIGNUP] Success!
```

### If You See Errors
Check the console error message:
- **"404 Not Found"** → Backend URL is wrong
- **"CORS error"** → Backend CORS not configured correctly
- **"Failed to fetch"** → Backend service is suspended/down
- **"Invalid credentials"** → Login attempt failed (correct behavior)

---

## Debugging Steps

### 1. Verify Backend is Running
```bash
curl https://jlpt-platform-backend.onrender.com/api/health
```
Expected response: `{"status":"healthy"}`

### 2. Test Backend Auth Directly
```bash
curl -X POST https://jlpt-platform-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "password": "Test123!",
    "role": "learner"
  }'
```

### 3. Check Render Logs
Go to https://dashboard.render.com → `jlpt-platform-backend` → Logs
Look for any errors during startup

### 4. Verify Vercel Logs
Go to https://vercel.com → Project Settings → Deployments → Click deployment → View Logs

---

## Configuration Summary

| Component | Config Location | Key Setting |
|-----------|-----------------|------------|
| **Frontend API URL** | `frontend/.env.production` | `VITE_API_URL` |
| **Backend CORS** | `backend/app/main.py` | `allow_origin_regex` |
| **Vercel Rewrite** | `vercel.json` | `/api → https://jlpt-platform-backend.onrender.com` |
| **Render Backend** | `render.yaml` | Start command, env vars |

---

## Alternative Approach (Optional)

If you don't want to use `.env.production`, you can rely on **Vercel rewrites** instead:

### Option A: Using `.env.production` (Current)
✅ Pros: Explicit, works everywhere
❌ Cons: Hardcoded URL

### Option B: Using Vercel Rewrites Only
✅ Pros: Frontend is deployment-agnostic
❌ Cons: Only works via Vercel proxy

To use Option B:
1. Remove `frontend/.env.production`
2. Keep `vercel.json` rewrites
3. Frontend will use `/api` (relative URL)
4. Vercel rewrites to backend

**Current implementation uses Option A** (more reliable).

---

## If Backend URL Changes

If you redeploy backend to a different URL:
1. Update `frontend/.env.production`:
   ```env
   VITE_API_URL=https://new-backend-url.com/api
   ```
2. OR update `vercel.json`:
   ```json
   "destination": "https://new-backend-url.com/api/:path*"
   ```
3. Commit and push to redeploy

---

## Need Help?

1. **Check console logs** (`F12`) - Look for `[SIGNUP]` or `[LOGIN]` messages
2. **Check network tab** - See actual request/response
3. **Check Render logs** - Backend errors
4. **Check Vercel logs** - Frontend build/deployment issues

