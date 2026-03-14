# Deployment Guide (Name.com + Full Stack)

This project is split into:
- `frontend` (Vite React app)
- `backend` (Node/Express API + MongoDB)

Recommended production architecture:
- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com`

## 1) Prepare environment variables

### Backend (`backend/.env`)
Start from `backend/.env.example` and set real values.

Required minimum:
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_ORIGINS`
- `FRONTEND_URL`
- `BACKEND_BASE_URL`

### Frontend (`frontend/.env.production`)
Set:
- `VITE_API_ORIGIN=https://api.yourdomain.com`

For local dev (`frontend/.env.local`):
- `VITE_DEV_API_TARGET=http://localhost:5000`

## 2) Deploy backend

Deploy `backend` on a Node host (Render/Railway/VM/etc).

Basic commands:
- Install: `npm install`
- Start: `npm start`

Health check endpoint:
- `GET /api/health`

After deploy, copy your backend public URL (example: `https://hotel-api.onrender.com`).

## 3) Deploy frontend

Deploy `frontend` on a static host (Vercel/Netlify/Cloudflare Pages).

Build command:
- `npm run build`

Publish directory:
- `dist`

Set env var on frontend host:
- `VITE_API_ORIGIN=https://api.yourdomain.com`

## 4) Connect Name.com DNS

In Name.com DNS records:

- For root domain (`yourdomain.com`):
  - If your frontend provider gives A records, add those A records.
  - If provider gives CNAME-only and supports ALIAS/ANAME flattening, use that.

- For www:
  - Type: `CNAME`
  - Host: `www`
  - Value: your frontend target (for example `cname.vercel-dns.com`)

- For API subdomain:
  - Type: `CNAME`
  - Host: `api`
  - Value: your backend target host (for example `hotel-api.onrender.com`)

Wait for DNS propagation (usually minutes, sometimes up to 24 hours).

## 5) Backend CORS and URLs

Set these backend vars to your real domain(s):
- `FRONTEND_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
- `FRONTEND_URL=https://yourdomain.com`
- `BACKEND_BASE_URL=https://api.yourdomain.com`

## 6) SSL/HTTPS

- Enable HTTPS on frontend host for `yourdomain.com` and `www.yourdomain.com`.
- Enable HTTPS on backend host for `api.yourdomain.com`.
- Keep all app URLs as `https://`.

## 7) Quick verification

1. Open `https://api.yourdomain.com/api/health` and verify success JSON.
2. Open frontend domain and test login/signup.
3. Test image loading from `/uploads`.
4. Test booking flow and admin pages.

## Optional: single-domain setup

If you host frontend and backend behind one reverse proxy (Nginx):
- Frontend on `/`
- Backend on `/api`, `/uploads`, `/invoices`
- Keep frontend `VITE_API_ORIGIN` empty.
