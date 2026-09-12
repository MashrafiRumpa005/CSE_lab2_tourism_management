# 3200 Project

A full-stack starter with a Vite React frontend and an Express TypeScript backend.

## Structure

- `frontend/` - React + Vite + TypeScript application
- `backend/` - Express + TypeScript API

## Run locally on Windows

```bash
npm install
npm run install:all
npm run dev:chrome
```

`npm run dev:chrome` opens a new terminal window for the backend and frontend, then opens Chrome at `http://localhost:5173`. Keep that terminal open while using the app. The backend uses nodemon to restart when files in `backend/src` change and Morgan to log API requests.

To start the services without opening Chrome, use `npm run dev` and visit `http://localhost:5173` manually.

The frontend runs at `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:3000`.

The health check is available at `http://localhost:3000/api/health`.
