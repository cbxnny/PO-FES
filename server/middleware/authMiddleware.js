const { createClient } = require('@supabase/supabase-js');

// Service-role client: dont never expose to the frontend.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // get jwt token

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  req.user = data.user;
  next();
};

module.exports = authenticateToken;