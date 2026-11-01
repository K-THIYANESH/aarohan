# Render Deployment Guide: AAROHAN DSS

This guide outlines how to deploy AAROHAN to Render using **Free Tier Web Services**.

---

## ⚡ Option 1: Automatic Blueprint (Recommended - 1 Click)

1. Push this repository to **GitHub** or **GitLab**.
2. Open your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect this repository.
5. Render will detect [`render.yaml`](./render.yaml) and automatically create:
   - **`aarohan-backend`**: Free Python Web Service (FastAPI)
   - **`aarohan-frontend`**: Free Static Site (Vite React SPA with client routing rewrites)
6. Click **Apply**.

---

## 🛠 Option 2: Manual Service Creation

If you prefer to configure services manually in Render's dashboard:

### 1. Backend Web Service (`aarohan-backend`)
- **Type**: Web Service
- **Environment**: `Python`
- **Root Directory**: `backend`
- **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Plan**: `Free`
- **Health Check Path**: `/health`
- **Environment Variables**:
  | Key | Value |
  |---|---|
  | `PYTHON_VERSION` | `3.10.12` |
  | `ENVIRONMENT` | `production` |
  | `ALLOWED_ORIGINS` | `*` (or your frontend render URL) |
  | `SECRET_KEY` | *(Click "Generate" or set 32+ character random string)* |
  | `DATABASE_URL` | `sqlite:///./aarohan.db` (or external PostgreSQL URL) |

### 2. Frontend Static Site (`aarohan-frontend`)
- **Type**: Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  | Key | Value |
  |---|---|
  | `VITE_API_URL` | `https://aarohan-backend.onrender.com` *(your backend Render URL)* |
- **Redirects / Rewrites**:
  - Add rewrite rule:
    - **Source**: `/*`
    - **Destination**: `/index.html`
    - **Action**: `Rewrite` (to allow React Router browser navigation without 404s)

---

## 💡 Important Tips for Render Free Tier
1. **Free Tier Spin-down**: On Render's free tier, backend web services spin down after 15 minutes of inactivity and take ~30–50 seconds to wake up upon receiving the first request.
2. **Persistent Storage**: SQLite database resets on service redeployment on the free tier. To persist relational data across deploys, you can spin up a free Managed PostgreSQL database on Render and set `DATABASE_URL=postgresql://...`.

