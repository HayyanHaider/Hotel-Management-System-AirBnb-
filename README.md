# Hotel-Management-System-HotelEase-

HotelEase is a full-stack hotel booking platform (React / Node / MongoDB) that enables guests to search, book and review hotels, lets owners manage rooms and earnings, and empowers admins to approve listings and handle disputes.

## Project structure

- `frontend`: React + Vite client
- `backend`: Node.js + Express API

## Local development

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The frontend dev server proxies `/api`, `/uploads`, and `/invoices` to `VITE_DEV_API_TARGET` (default: `http://localhost:5000`).

## Production deployment

Detailed instructions for Name.com DNS + backend/frontend hosting are in `DEPLOYMENT.md`.
