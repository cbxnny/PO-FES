const { createClient } = require('@supabase/supabase-js');
const pool = require('../db');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, role, firstName, lastName, email FROM users WHERE auth_id = $1',
      [data.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'No profile found for this account. Please contact support.' });
    }

    const dbUser = result.rows[0];
    req.user = {
      id: dbUser.id,
      authId: data.user.id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.firstname,
      lastName: dbUser.lastname
    };
    next();
  } catch (err) {
    console.error('AUTH MIDDLEWARE DB ERROR:', err);
    return res.status(500).json({ error: 'Server error verifying account.' });
  }
};

module.exports = authenticateToken;