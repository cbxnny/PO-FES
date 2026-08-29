const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow local dev (any localhost port) always, plus the deployed frontend's
// real URL once FRONTEND_URL is set as an environment variable in production
// (e.g. FRONTEND_URL=https://your-app.vercel.app).
const allowedOrigins = [/^http:\/\/localhost:\d+$/];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some((allowed) =>
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    );
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  }
}));
app.use(express.json());

// Initialise DB tables on startup
require('./db');

const authenticateToken = require('./middleware/authMiddleware');
const authRoutes = require('./routes/auth');

// Public auth routes
app.use('/api', authRoutes);
app.use('/api/teams', require('./routes/feedback'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/users', require('./routes/users'));

// Example protected route — validates a Supabase access token.
// NOTE: any route that reads/writes app data should query through
// supabase-js (service-role client, or by forwarding the caller's token),
// not the raw `pg.Pool` in db.js — that connection bypasses RLS entirely.
app.get('/api/protected-data', authenticateToken, (req, res) => {
  res.json({ message: 'You have access!', user: req.user });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));