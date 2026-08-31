/**
 * auth.js
 *
 * Authentication utilities for PO-FES.
 *
 * Session state is stored in sessionStorage (cleared when the browser tab
 * closes) under two keys:
 *   - po_fes_current_user  JSON-serialised user object returned by the API
 *   - po_fes_token         JWT used to authenticate subsequent API requests
 *
 * NOTE: The DEFAULT_USERS array and initAuth() are legacy scaffolding from
 * the localStorage prototype. They are kept for backward compatibility but
 * are no longer used by the login / signup flows, which now call the real
 * backend API.
 */

// ---------------------------------------------------------------------------
// Legacy seed data (no longer used by login/signup — kept for reference)
// ---------------------------------------------------------------------------

const DEFAULT_USERS = [
  { name: 'Project Owner User',    email: 'owner@qut.edu.au',      password: 'Password123!', role: 'Project Owner' },
  { name: 'Student User',          email: 'student@qut.edu.au',    password: 'Password123!', role: 'Student' },
  { name: 'Industry Liaison User', email: 'liaison@qut.edu.au',    password: 'Password123!', role: 'Industry Liaison' },
  { name: 'Unit Coordinator User', email: 'coordinator@qut.edu.au', password: 'Password123!', role: 'Unit Coordinator' }
];

/**
 * Seeds localStorage with DEFAULT_USERS if no users exist yet.
 * @deprecated No longer required now that auth goes through the backend API.
 */
export const initAuth = () => {
  if (!localStorage.getItem('po_fes_users')) {
    localStorage.setItem('po_fes_users', JSON.stringify(DEFAULT_USERS));
  }
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the email address is syntactically valid.
 * Checks for characters before @, a domain segment, and a TLD.
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Analyses a password and returns a strength score plus user-facing feedback.
 *
 * Scoring (one point each):
 *   1. At least 8 characters
 *   2. Contains an uppercase letter
 *   3. Contains a digit
 *   4. Contains a special character (@$!%*?&)
 *
 * @param {string} password
 * @returns {{
 *   score: number,       // 0–4
 *   label: string,       // 'Weak' | 'Fair' | 'Good' | 'Strong'
 *   color: string,       // hex colour for the strength indicator
 *   feedback: string[],  // list of unmet requirements
 *   isValid: boolean     // true only when score === 4
 * }}
 */
export const checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character (@$!%*?&)');
  }

  let label = 'Weak';
  let color = '#ef4444'; // red
  if (score === 2) { label = 'Fair';   color = '#f59e0b'; } // amber
  if (score === 3) { label = 'Good';   color = '#3b82f6'; } // blue
  if (score === 4) { label = 'Strong'; color = '#10b981'; } // green

  return { score, label, color, feedback, isValid: score === 4 };
};

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------

const API = 'http://localhost:3001/api';

// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------

/**
 * Registers a new user via the backend API and stores the returned session.
 * Throws an Error with a user-facing message on failure.
 *
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @returns {Promise<Object>} The created user object (without password).
 */
export const registerUser = async (firstName, lastName, email, password, role) => {
  const res = await fetch(`${API}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password, role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  // Only store session data if the email has already been confirmed.
  // When email verification is required, the server returns
  // needsEmailConfirmation: true and null tokens.
  if (data.token) {
    sessionStorage.setItem('po_fes_current_user', JSON.stringify(data.user));
    sessionStorage.setItem('po_fes_token', data.token);
    if (data.refreshToken) sessionStorage.setItem('po_fes_refresh_token', data.refreshToken);
  }

  return { ...data.user, needsEmailConfirmation: !!data.needsEmailConfirmation };
};

/**
 * Logs in an existing user via the backend API and stores the returned session.
 * Throws an Error with a user-facing message on failure.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} The authenticated user object (without password).
 */
export const loginUser = async (email, password) => {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  sessionStorage.setItem('po_fes_current_user', JSON.stringify(data.user));
  sessionStorage.setItem('po_fes_token', data.token);
  if (data.refreshToken) sessionStorage.setItem('po_fes_refresh_token', data.refreshToken);
  return data.user;
};

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Returns the currently logged-in user from sessionStorage, or null if no
 * session exists.
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  const stored = sessionStorage.getItem('po_fes_current_user');
  return stored ? JSON.parse(stored) : null;
};

/**
 * Clears the current session from sessionStorage.
 * Call this on logout before redirecting to /login.
 */
export const logoutUser = () => {
  sessionStorage.removeItem('po_fes_current_user');
  sessionStorage.removeItem('po_fes_token');
  sessionStorage.removeItem('po_fes_refresh_token');
};

/**
 * Returns the stored JWT, or null if the user is not logged in.
 * Pass this as a Bearer token in Authorization headers for protected routes.
 * @returns {string|null}
 */
export const getAuthToken = () => sessionStorage.getItem('po_fes_token');
export const getRefreshToken = () => sessionStorage.getItem('po_fes_refresh_token');

/**
 * Exchanges the stored refresh token for a new access token, updating
 * sessionStorage in place. Returns the new access token, or null if the
 * refresh itself failed (meaning the person genuinely needs to log in again).
 */
export const refreshSession = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) return null;

    const data = await res.json();
    sessionStorage.setItem('po_fes_token', data.token);
    if (data.refreshToken) sessionStorage.setItem('po_fes_refresh_token', data.refreshToken);
    return data.token;
  } catch {
    return null;
  }
};

/**
 * Wraps fetch with automatic 401/403 recovery: on an expired-token response,
 * attempts one silent refresh and retries the request once with the new
 * token. Only logs the user out if the refresh itself fails.
 */
export const authFetch = async (url, options = {}) => {
  const withAuthHeader = (token) => ({
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  let res = await fetch(url, withAuthHeader(getAuthToken()));

  if (res.status === 401 || res.status === 403) {
    const newToken = await refreshSession();

    if (!newToken) {
      logoutUser();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    res = await fetch(url, withAuthHeader(newToken));
  }

  return res;
};