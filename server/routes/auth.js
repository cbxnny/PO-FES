const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Service-role client for server-side auth operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/signup
 * Body: { firstName, lastName, email, password, role }
 * Creates a new user in Supabase Auth and returns a session token.
 */
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName, role }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName,
      lastName,
      role
    },
    token: data.session?.access_token ?? null
  });
});

/**
 * POST /api/login
 * Body: { email, password }
 * Signs in a user via Supabase Auth and returns a session token.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  const meta = data.user.user_metadata ?? {};

  return res.status(200).json({
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName: meta.firstName ?? '',
      lastName: meta.lastName ?? '',
      role: meta.role ?? ''
    },
    token: data.session.access_token
  });
});

module.exports = router;
