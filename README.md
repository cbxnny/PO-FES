# PO-FES

A full-stack web application built with **React + Vite** (frontend) and **Express + PostgreSQL** (backend), using Supabase as the hosted database.




## Project Structure

```
PO-FES/
├── src/              # React frontend source
├── server/           # Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── db.js         # Database connection & table init
│   ├── index.js      # Server entry point
│   └── .env          # Backend environment variables
├── index.html
├── vite.config.js
└── package.json
```


## Getting Started

### 1. Install Frontend Dependencies

From the **root** of the project:

```bash
npm install
```

### 2. Install Backend Dependencies

Navigate into the `server` folder and install:

```bash
cd server
npm install
```

---

## Environment Variables

The backend requires a `.env` file inside the `server/` directory.

A `.env` file should already be present. If not, create `server/.env` with the following:

```env
# Database
DATABASE_URL=your_supabase_connection_string

# Auth
JWT_SECRET=your_jwt_secret
```

---

## Running the App

You need to run **both** the frontend and backend simultaneously. Open two terminal windows/tabs:

### Terminal 1 — Start the Backend

```bash
cd server
node index.js
```

The server will start at: `http://localhost:3001`

### Terminal 2 — Start the Frontend

From the **root** of the project:

```bash
npm run dev
```

The frontend will start at: `http://localhost:5173` (or the next available port)

---

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

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite |
| Backend | Express.js |
| Database | PostgreSQL (via Supabase) |
| Auth | JWT + bcryptjs |
| Icons | Lucide React |
