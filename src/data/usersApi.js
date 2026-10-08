import { authFetch } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL;

// Sends parsed spreadsheet rows to the backend for bulk account creation.
// users: [{ firstName, lastName, email, phoneNo, role }, ...]
// Returns { total, succeeded, failed, results: [{ row, email, status, message? }] }
export const bulkImportUsers = async (users) => {
  const res = await authFetch(`${API_BASE}/users/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to import users');
  return data;
};

// Imported accounts that haven't set a password yet.
// Returns [{ id, firstName, lastName, email, role, invitedAt }]
export const getPendingInvites = async () => {
  const res = await authFetch(`${API_BASE}/users/pending-invites`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load pending invites');
  return data.users;
};

// Re-sends the set-password invite email to one pending user.
export const resendInvite = async (userId) => {
  const res = await authFetch(`${API_BASE}/users/resend-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to resend invite');
  return data;
};
