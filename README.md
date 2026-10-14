# PO-FES

Project Owner Feedback & Evaluation System. A full-stack web application built with **React + Vite** (frontend) and **Express** (backend), using **Supabase** for the database and authentication, and **Brevo** for email notifications.

Live site: https://po-fes.vercel.app/


## Project Structure

```
PO-FES/
├── src/              # React frontend source
├── server/           # Express backend
│   ├── controllers/
│   ├── middleware/   # JWT authentication and role checks
│   ├── routes/       # auth, feedback, meetings, users
│   ├── utils/        # shared helpers (e.g. role normalisation)
│   ├── db.js         # Database connection & automatic table creation
│   ├── index.js      # Server entry point
│   └── .env          # Backend environment variables (not committed, create it yourself)
├── .env              # Frontend environment variables (not committed, create it yourself)
├── index.html
├── vite.config.js
└── package.json
```


## Prerequisites

- Node.js v22 (the team developed on v22.14.0) and npm
- Git
- Access to the project's Supabase project and Brevo account (ask the team for the values listed under Environment Variables)

Keep the project folder outside any OneDrive-synced location (for example `~/PO-FES`). OneDrive syncing can corrupt `node_modules` and cause file errors.


## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/cbxnny/PO-FES.git
cd PO-FES
```

### 2. Install Frontend Dependencies

From the **root** of the project:

```bash
npm install
```

### 3. Install Backend Dependencies

Navigate into the `server` folder and install:

```bash
cd server
npm install
```

All packages are already declared in each `package.json`, so no individual install commands are needed.

### 4. Set Up Environment Variables

The repository does not include any `.env` files. Create the two below and ask the team for the values. Never commit these files.

**Backend: `server/.env`**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler connection string (port 6543) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key for server-side admin calls. Never expose it to the frontend. |
| `BREVO_API_KEY` | Brevo API key for sending email |
| `FRONTEND_URL` | Optional. Frontend address used in invite email links. Defaults to `http://localhost:5173`. |
| `PORT` | Optional. Port the server listens on. Defaults to `3001`. |

**Frontend: `.env` in the project root**

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public (anon) key |
| `VITE_API_URL` | Base URL of the backend API (for local development, `http://localhost:3001`) |

Use the Supabase **Transaction pooler** URL (port 6543). Direct connection URLs are deprecated and cause DNS errors.

Invite emails sent by the coordinator's bulk user import link to `<FRONTEND_URL>/set-password`. Add that address in Supabase under Authentication → URL Configuration → Redirect URLs.

### 5. Database

No manual SQL is needed. When the server starts, `server/db.js` connects using `DATABASE_URL` and creates all tables if they do not exist. A successful start prints `Database connected and tables ready`.


## Running the App

You need to run **both** the frontend and backend simultaneously. Open two terminal windows/tabs:

### Terminal 1: Start the Backend

```bash
cd server
node index.js
```

The server will start at: `http://localhost:3001` (`npm start` does the same thing)

### Terminal 2: Start the Frontend

From the **root** of the project:

```bash
npm run dev
```

The frontend will start at: `http://localhost:5173` (or the next available port)

The backend accepts requests from any `localhost` port and from `https://po-fes.vercel.app`.


## Available Scripts

### Frontend (root directory)

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint checks |

### Backend (`server/` directory)

| Command | Description |
|---|---|
| `node index.js` | Start the Express server |
| `npm start` | Same as `node index.js` |


## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite |
| Backend | Express.js |
| Database | PostgreSQL hosted on Supabase (via `pg`) |
| Auth | Supabase Authentication, JWTs verified with `jsonwebtoken` and `jwks-rsa` |
| Email | Brevo HTTP API (`@getbrevo/brevo`) |
| Icons | Lucide React |
| Hosting | Vercel (frontend), Render (backend) |


## Deployment

- **Frontend:** Vercel, at https://po-fes.vercel.app/
- **Backend:** Render (free tier). Production environment variables are set in the Render dashboard. After a push, the new build can take a little while to go live.

Render's free tier blocks outbound SMTP ports (465, 587 and 2525), which is why email is sent through Brevo's HTTP API.


## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `Cannot find module` on server start | Dependencies were installed in the wrong folder. Run `npm install` again inside `server`. |
| Database DNS or connection errors | Use the Supabase Transaction pooler URL (port 6543), not the direct connection URL. |
| Emails not sending in production | Check `BREVO_API_KEY` on Render and that the sender address is verified in Brevo. |
| Strange file errors or a broken `node_modules` | Move the project out of OneDrive, delete `node_modules`, and reinstall. |
| Frontend cannot reach the backend | Confirm the server terminal is running and `VITE_API_URL` matches the server port. |


## Known Limitation

The backend connects to Supabase as the `postgres` superuser through the transaction pooler, which bypasses Row Level Security (RLS). Access control is enforced in the Express backend rather than by database policies.
