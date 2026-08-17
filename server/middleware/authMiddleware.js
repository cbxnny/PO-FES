const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const pool = require('../db');

const client = jwksClient({
  jwksUri: process.env.SUPABASE_JWKS_URL,
  cache: true,
  cacheMaxAge: 3600000 // 1 hour — key is fetched once, then reused from memory
});

const getSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, getSigningKey, { algorithms: ['ES256'] }, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    try {
      const result = await pool.query(
        'SELECT id, role, firstName, lastName, email FROM users WHERE auth_id = $1',
        [decoded.sub]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'No profile found for this account.' });
      }

      const dbUser = result.rows[0];
      req.user = {
        id: dbUser.id,
        authId: decoded.sub,
        email: dbUser.email,
        role: dbUser.role,
        firstName: dbUser.firstname,
        lastName: dbUser.lastname
      };
      next();
    } catch (dbErr) {
      console.error('AUTH MIDDLEWARE DB ERROR:', dbErr);
      return res.status(500).json({ error: 'Server error verifying account.' });
    }
  });
};

module.exports = authenticateToken;