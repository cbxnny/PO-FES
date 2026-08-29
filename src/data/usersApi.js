import { authFetch } from '../utils/auth';

import { API_BASE } from '../utils/apiConfig';

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
