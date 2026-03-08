# 🚀 CampusMind AI - Global Deployment Guide

This guide details the step-by-step process to deploy **CampusMind AI** for a global audience, ensuring scalability, security, and performance.

---

## 🏗️ Architecture Overview

| Component | Technology | Recommended Host | Why? |
| :--- | :--- | :--- | :--- |
| **Frontend** | React (Vite) | **Vercel** | Global CDN, optimized for React/SPA. |
| **Backend** | Node.js (Express) | **Render / Railway** | Persistent server, supports WebSockets. |
| **AI Engine** | Python (FastAPI) | **Render / Railway** | Native Python support, good scaling. |
| **Database** | MongoDB | **MongoDB Atlas** | Managed, global clusters. |
| **Cache** | Redis | **Upstash** | Serverless Redis, free tier available. |
| **Storage** | S3 | **AWS S3** | Infinite scalability for files. |

---

## ✅ Part 1: Database & Services Setup

### 1. MongoDB Atlas (Database)
1.  Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2.  Whitelist Access: Allow access from anywhere (`0.0.0.0/0`) for cloud servers.
3.  Get Connection String: `mongodb+srv://<user>:<password>@cluster.mongodb.net/campusmind?retryWrites=true&w=majority`

### 2. Upstash (Redis Cache)
1.  Create a database on [Upstash](https://upstash.com/).
2.  Get the `REDIS_URL`.

---

## 🖥️ Part 2: Backend Deployment (Render)

1.  Push your code to **GitHub**.
2.  Go to [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your repository.
5.  **Settings**:
    *   **Root Directory**: `server`
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
    *   **Environment Variables**:
        *   `NODE_ENV`: `production`
        *   `PORT`: `10000` (Render default)
        *   `MONGO_URI`: (From Atlas)
        *   `JWT_SECRET`: (Generate a strong secret)
        *   `REDIS_URL`: (From Upstash)
        *   `AWS_ACCESS_KEY_ID`: (Your AWS Key)
        *   `AWS_SECRET_ACCESS_KEY`: (Your AWS Secret)
        *   `AWS_BUCKET_NAME`: (Your Bucket)
        *   `AI_SERVICE_URL`: `https://your-ai-service.onrender.com` (Set this *after* deploying AI service)

6.  Click **Deploy**.

---

## 🤖 Part 3: AI Service Deployment (Render)

1.  Create another **Web Service** on Render.
2.  Connect the same repository.
3.  **Settings**:
    *   **Root Directory**: `ai-service`
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `python -m app.main`
    *   **Environment Variables**:
        *   `OPENAI_API_KEY`: (Or Gemini Key)
        *   `MONGO_URI`: (Same as backend)

4.  Click **Deploy**. Copy the URL (e.g., `https://campusmind-ai.onrender.com`) and update the `AI_SERVICE_URL` in your Backend service.

---

## 🌐 Part 4: Frontend Deployment (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Settings**:
    *   **Root Directory**: `client`
    *   **Framework Preset**: Vite
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   **Environment Variables**:
        *   `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com` (The URL from Part 2)
        *   `VITE_GOOGLE_CLIENT_ID`: (Your Google OAuth ID)

5.  Click **Deploy**.

---

## 🔄 CI/CD Pipeline (GitHub Actions)

We have included a GitHub Action workflow to automatically test and build your project on every push.

*   **File**: `.github/workflows/ci.yml`
*   **Triggers**: On push to `main` branch.
*   **Jobs**:
    *   **Frontend Build**: Installs dependencies and runs `vite build`.
    *   **Backend Check**: Installs dependencies to verify integrity.

To enable **Continuous Deployment (CD)**:
*   **Vercel & Render** automatically trigger redeploys when you push to the `main` branch on GitHub. No extra configuration needed!

---

## 🚀 Final Verification

1.  Open your **Vercel URL**.
2.  **Login** with Google (Ensure you added the Vercel domain to your Google Cloud Console "Authorized Origins").
3.  Check **Peer Match** (Requires WebSocket connection to Backend).
4.  Upload a Resume to test **AI Service** connection.

**Status**: 🟢 **READY FOR GLOBAL LAUNCH**
