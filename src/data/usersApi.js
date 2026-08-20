import { getAuthToken } from '../utils/auth';

const API_BASE = 'http://localhost:3001/api';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Sends parsed spreadsheet rows to the backend for bulk account creation.
// users: [{ firstName, lastName, email, role }, ...]
// Returns { total, succeeded, failed, results: [{ row, email, status, message? }] }
export const bulkImportUsers = async (users) => {
  const res = await fetch(`${API_BASE}/users/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ users })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to import users');
  return data;
};
