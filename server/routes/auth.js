const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../db');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Our teams/feedback tables key off users.id (integer), not Supabase's UUID,
// so every authenticated account needs a row here linking the two.
const syncUserRecord = async ({ authId, firstName, lastName, email, role }) => {
  const result = await pool.query(
    `INSERT INTO users (auth_id, firstName, lastName, email, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE
       SET auth_id = EXCLUDED.auth_id,
           firstName = EXCLUDED.firstName,
           lastName = EXCLUDED.lastName,
           role = EXCLUDED.role
     RETURNING id, role, firstName, lastName, email`,
    [authId, firstName, lastName, email, role]
  );
  return result.rows[0];
};
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
    options: { data: { firstName, lastName, role } }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const dbUser = await syncUserRecord({
      authId: data.user.id,
      firstName,
      lastName,
      email,
      role
    });

    // If the user's email is not yet confirmed, do NOT return session tokens.
    // Supabase may still return a session object, but we must not hand it to
    // the client until the email has been verified.
    const emailConfirmed = !!data.user.email_confirmed_at;

    if (!emailConfirmed) {
      return res.status(201).json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstname,
          lastName: dbUser.lastname,
          role: dbUser.role
        },
        needsEmailConfirmation: true,
        token: null,
        refreshToken: null
      });
    }

    return res.status(201).json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstname,
        lastName: dbUser.lastname,
        role: dbUser.role
      },
      token: data.session?.access_token ?? null,
      refreshToken: data.session?.refresh_token ?? null
    });
  } catch (dbErr) {
    console.error('SIGNUP DB SYNC ERROR:', dbErr);
    return res.status(500).json({ error: 'Account created, but failed to save profile. Contact support.' });
  }
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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Block login for users who haven't confirmed their email yet.
  if (!data.user.email_confirmed_at) {
    return res.status(403).json({
      error: 'Please verify your email address before logging in. Check your inbox for the confirmation link.'
    });
  }

  const meta = data.user.user_metadata ?? {};

  try {
    // Self-heals accounts that authenticated before this sync existed,
    // so login never 500s on a row missing auth_id.
    const dbUser = await syncUserRecord({
      authId: data.user.id,
      firstName: meta.firstName ?? '',
      lastName: meta.lastName ?? '',
      email: data.user.email,
      role: meta.role ?? ''
    });

    return res.status(200).json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstname,
        lastName: dbUser.lastname,
        role: dbUser.role
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    });
  } catch (dbErr) {
    console.error('LOGIN DB SYNC ERROR:', dbErr);
    return res.status(500).json({ error: 'Login succeeded, but failed to load profile. Contact support.' });
  }
});

/**
 * POST /api/refresh
 * Body: { refreshToken }
 * Exchanges a valid refresh token for a new access token + refresh token,
 * without requiring the user's password again.
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  return res.status(200).json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token
  });
});

module.exports = router;
