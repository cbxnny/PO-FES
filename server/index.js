const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json());


const authenticateToken = require('./middleware/authMiddleware');

// testing jwt
app.get('/api/protected-data', authenticateToken, (req, res) => {

  res.json({ message: "You have access!", user: req.user });
});


app.post('/api/signup', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (firstName, lastName, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, firstName, lastName, email, role',
      [firstName, lastName, email.toLowerCase(), hashedPassword, role]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'beUoA}j}}[N?ZL7V+_Wm:4gGD8%d%)wL{qYul]o.gY_K&qnP|}N/gGQ6ufP[mO/aC5jJ<raf#S3M{:h%@;$CfJ',
      { expiresIn: '24h' }
    );
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found. Please sign up first.' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key',
      { expiresIn: '24h' }
    );
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));