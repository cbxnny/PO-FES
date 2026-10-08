import { authFetch } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL;

// Parses a JSON response, with a readable error if the server sent HTML instead
// (e.g. a 404 page because the endpoint isn't deployed, or a wrong API URL).
const parseJson = async (res) => {
  try {
    return await res.json();
  } catch {
    throw new Error(`Unexpected response from the server (HTTP ${res.status}). The API may be unreachable or out of date.`);
  }
};

// Sends parsed spreadsheet rows to the backend for bulk account creation.
// users: [{ firstName, lastName, email, phoneNo, role }, ...]
// Returns { total, succeeded, failed, results: [{ row, email, status, message? }] }
export const bulkImportUsers = async (users) => {
  const res = await authFetch(`${API_BASE}/users/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users })
  });

  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || 'Failed to import users');
  return data;
};

// Imported accounts that haven't set a password yet.
// Returns [{ id, firstName, lastName, email, role, invitedAt }]
export const getPendingInvites = async () => {
  const res = await authFetch(`${API_BASE}/users/pending-invites`);
  const data = await parseJson(res);
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
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || 'Failed to resend invite');
  return data;
};
