// Single source of truth for the backend's base URL.
//
// Locally, this defaults to http://localhost:3001/api, matching the
// Express server's default port — no .env needed for local dev.
//
// In production, set VITE_API_URL as a build-time environment variable
// on whatever platform hosts the frontend (e.g. Vercel/Netlify), pointing
// at your deployed backend, e.g.:
//   VITE_API_URL=https://your-backend.onrender.com/api
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
