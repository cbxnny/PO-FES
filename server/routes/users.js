const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { normalizeRole } = require('../utils/roleUtils');

// Service-role client — required for supabase.auth.admin.* calls.
// SUPABASE_SERVICE_ROLE_KEY must never be exposed to the frontend; it only
// ever lives here, server-side, same as in authMiddleware.js / auth.js.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_ROLES = ['client', 'student', 'tutor', 'coordinator', 'liaison'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z]+(-[A-Za-z]+)*$/;
// Matches Australian numbers in +61 form (+61 4XXXXXXXX) or local form
// (04XXXXXXXX / 0[2378]XXXXXXXX), ignoring spaces/dashes the user typed.
const AU_PHONE_REGEX = /^(?:\+61[2-478]\d{8}|0[2-478]\d{8})$/;
const MAX_BATCH_SIZE = 500;
// Where the invite email's link sends people to choose their password.
// Must also be added under Supabase > Authentication > URL Configuration > Redirect URLs.
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const SET_PASSWORD_URL = `${FRONTEND_URL}/set-password`;

const validateRow = (row, index) => {
  const errors = [];
  const firstName = (row.firstName || '').trim();
  const lastName = (row.lastName || '').trim();
  const email = (row.email || '').trim().toLowerCase();
  const phoneNo = (row.phoneNo || '').trim();
  const phoneDigitsOnly = phoneNo.replace(/[\s-]/g, '');
  const role = normalizeRole(row.role || '');

  if (!firstName) errors.push('Missing firstName');
  else if (!NAME_REGEX.test(firstName)) errors.push('firstName must contain letters only, no spaces or numbers');

  if (!lastName) errors.push('Missing lastName');
  else if (!NAME_REGEX.test(lastName)) errors.push('lastName must contain letters only, no spaces or numbers');

  if (!email) errors.push('Missing email');
  else if (!EMAIL_REGEX.test(email)) errors.push('Invalid email format');

  if (!phoneNo) errors.push('Missing phoneNo');
  else if (!AU_PHONE_REGEX.test(phoneDigitsOnly)) errors.push('phoneNo must be a valid Australian number (e.g. +61400000000 or 0400000000)');

  if (!VALID_ROLES.includes(role)) errors.push(`Unrecognised role "${row.role}"`);

  return { firstName, lastName, email, phoneNo, role, errors, rowNumber: index + 1 };
};

/**
 * POST /api/users/bulk-import
 * Body: { users: [{ firstName, lastName, email, phoneNo, role }, ...] }
 * All fields are required.
 *
 * Coordinator-only (enforced by requireRole below). For each valid row:
 *   1. Creates a Supabase Auth user via inviteUserByEmail — this sends the
 *      new account owner an email to set their OWN password. The server
 *      never generates, receives, or stores a plaintext password anywhere
 *      in this flow.
 *   2. Inserts a matching row into the `users` table, linked via auth_id,
 *      the same way routes/auth.js does on normal signup.
 *
 * Rows are processed sequentially and independently: one bad row (bad
 * email, duplicate account, unrecognised role, etc.) is recorded in the
 * results array instead of failing the whole batch.
 */
router.post('/bulk-import', authenticateToken, requireRole('coordinator'), async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'Request must include a non-empty "users" array.' });
  }
  if (users.length > MAX_BATCH_SIZE) {
    return res.status(400).json({ error: `Batch too large — please split into files of ${MAX_BATCH_SIZE} rows or fewer.` });
  }

  const results = [];

  for (let i = 0; i < users.length; i++) {
    const { firstName, lastName, email, phoneNo, role, errors, rowNumber } = validateRow(users[i], i);

    if (errors.length > 0) {
      results.push({ row: rowNumber, email: users[i].email || null, status: 'error', message: errors.join('; ') });
      continue;
    }

    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { data: { firstName, lastName, role }, redirectTo: SET_PASSWORD_URL }
      );

      if (inviteError) {
        results.push({ row: rowNumber, email, status: 'error', message: inviteError.message });
        continue;
      }

      const dbResult = await pool.query(
        `INSERT INTO users (auth_id, firstName, lastName, email, phone_no, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [inviteData.user.id, firstName, lastName, email, phoneNo, role]
      );

      if (dbResult.rows.length === 0) {
        results.push({
          row: rowNumber,
          email,
          status: 'error',
          message: 'Invite sent, but a profile with this email already existed in the users table — check for duplicates.'
        });
        continue;
      }

      results.push({ row: rowNumber, email, status: 'invited', userId: dbResult.rows[0].id });
    } catch (err) {
      console.error(`Bulk import row ${rowNumber} failed:`, err);
      results.push({ row: rowNumber, email, status: 'error', message: 'Server error creating this account.' });
    }
  }

  const succeeded = results.filter((r) => r.status === 'invited').length;
  res.status(200).json({
    total: users.length,
    succeeded,
    failed: users.length - succeeded,
    results
  });
});

/**
 * GET /api/users/pending-invites
 * Coordinator-only. Lists imported accounts that have not set a password yet
 * (their Supabase auth record has no password), so the UI can offer a
 * "Resend invite" button for each.
 */
router.get('/pending-invites', authenticateToken, requireRole('coordinator'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.firstName, u.lastName, u.email, u.role, au.invited_at
         FROM users u
         JOIN auth.users au ON au.id = u.auth_id
        WHERE au.encrypted_password IS NULL OR au.encrypted_password = ''
        ORDER BY au.invited_at DESC NULLS LAST, u.id DESC`
    );

    res.json({
      users: result.rows.map((r) => ({
        id: r.id,
        firstName: r.firstname,
        lastName: r.lastname,
        email: r.email,
        role: r.role,
        invitedAt: r.invited_at
      }))
    });
  } catch (err) {
    console.error('PENDING INVITES ERROR:', err);
    res.status(500).json({ error: 'Failed to load pending invites.' });
  }
});

/**
 * POST /api/users/resend-invite
 * Body: { userId }   (users.id from our own table)
 * Coordinator-only. Re-sends the invite email to an imported user who has not
 * set a password yet. Refuses if the account already has a password.
 *
 * If the person clicked their original link (which marks the email confirmed)
 * but never finished choosing a password, Supabase will refuse to re-invite a
 * "confirmed" user — so we reset the confirmation first, which is safe because
 * they have no password and therefore cannot sign in anyway.
 */
router.post('/resend-invite', authenticateToken, requireRole('coordinator'), async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.firstName, u.lastName, u.email, u.role, u.auth_id,
              au.encrypted_password, au.email_confirmed_at
         FROM users u
         JOIN auth.users au ON au.id = u.auth_id
        WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const row = result.rows[0];

    if (row.encrypted_password) {
      return res.status(409).json({ error: 'This user has already set a password. No invite needed.' });
    }

    if (row.email_confirmed_at) {
      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(row.auth_id, {
        email_confirm: false
      });
      if (resetError) {
        console.error('RESEND INVITE RESET ERROR:', resetError);
        return res.status(500).json({ error: 'Could not prepare this account for a new invite.' });
      }
    }

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(row.email, {
      data: { firstName: row.firstname, lastName: row.lastname, role: row.role },
      redirectTo: SET_PASSWORD_URL
    });

    if (inviteError) {
      return res.status(400).json({ error: inviteError.message });
    }

    res.json({ message: `Invite re-sent to ${row.email}.` });
  } catch (err) {
    console.error('RESEND INVITE ERROR:', err);
    res.status(500).json({ error: 'Server error re-sending invite.' });
  }
});

module.exports = router;
