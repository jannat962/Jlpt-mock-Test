# 🚀 JLPT Platform - Deployment Guide

## Current Architecture
- **Frontend**: Deployed on Vercel (Next.js/Vite)
- **Backend**: Should be deployed on Render (FastAPI)
- **Database**: PostgreSQL (on Render)
- **Communication**: Vercel proxies `/api/*` requests to Render backend

---

## ✅ Step 1: Deploy Backend to Render

### 1.1 Prerequisites
- GitHub account with this repo pushed
- Render account (free tier available at https://render.com)

### 1.2 Deploy Backend Service

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repo
4. Configure as follows:
   - **Name**: `jlpt-platform-backend`
   - **Runtime**: `Python 3.10`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

5. Click **"Create Web Service"**

### 1.3 Add Database to Render

1. In the same Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure as follows:
   - **Name**: `jlpt-db`
   - **Database**: `jlpt_n4_db`
   - **User**: `jlpt_user`
   - **Region**: Choose your closest region
   - **Plan**: Free (or Starter if free unavailable)

3. Click **"Create Database"**

### 1.4 Add Environment Variables to Backend Service

1. Go back to your `jlpt-platform-backend` service
2. Click **"Environment"**
3. Add these environment variables:
   - **DATABASE_URL**: Copy the full connection string from your PostgreSQL database (it will be auto-populated as an internal database link)
   - **SECRET_KEY**: Generate a random secure key, e.g., `openssl rand -hex 32`
   - **ALGORITHM**: `HS256`

4. Click **"Save"**

The backend will auto-redeploy. Wait for the status to show **"Live"**.

---

## ✅ Step 2: Verify Backend is Running

Test your backend health check:
```bash
curl https://jlpt-platform-backend.onrender.com/api/health
```

Expected response:
```json
{"status": "healthy"}
```

If you get a **404** or timeout:
- Check Render dashboard → Logs
- Verify DATABASE_URL is correctly set
- Ensure service status is "Live" (not "Suspended")

---

## ✅ Step 3: Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Configure as follows:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Click **"Deploy"**

Vercel will automatically rewrite `/api/*` requests to your Render backend based on `vercel.json`.

---

## ✅ Step 4: Test the Full Stack

### Test Signup (the issue you're fixing)
```bash
curl -X POST https://jlpt-platform.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "role": "learner"
  }'
```

Expected response:
```json
{
  "id": 1,
  "name": "Test User",
  "email": "test@example.com",
  "role": "learner"
}
```

### Test Login
```bash
curl -X POST https://jlpt-platform.vercel.app/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'username=test@example.com&password=Test123!'
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **404 on /api/signup** | Backend not deployed or Render service suspended → Resume service in Render dashboard |
| **502 Bad Gateway** | Backend crashed → Check Render Logs for errors |
| **Database Connection Error** | DATABASE_URL not set on Render → Add it in Environment variables |
| **CORS errors** | Frontend URL not in CORS origins → Update backend `main.py` CORS config |
| **Auth errors (401)** | SECRET_KEY mismatch between Render and .env → Ensure SECRET_KEY is set on Render |

---

## 📝 If You Change the Backend URL

If you deploy backend elsewhere (not Render):
1. Update `vercel.json`:
   ```json
   "destination": "https://YOUR_BACKEND_URL/api/:path*"
   ```

2. Redeploy frontend to Vercel

---

## 🔐 Security Checklist

- [ ] Backend `SECRET_KEY` is a strong random string (not `"your-secret-key-here"`)
- [ ] DATABASE_URL contains strong password (not shown in Render logs)
- [ ] Frontend only deployed to HTTPS (Vercel does this by default)
- [ ] CORS origins whitelist only your domains (not `"*"`)
- [ ] No credentials committed to Git (.env is in .gitignore)

---

## 📚 Links
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Backend Health: https://jlpt-platform-backend.onrender.com/api/health
- Frontend: https://jlpt-platform.vercel.app
