const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
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

app.listen(3001, () => console.log('Server running on http://localhost:3001'));