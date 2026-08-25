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
        { data: { firstName, lastName, role } }
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

module.exports = router;
