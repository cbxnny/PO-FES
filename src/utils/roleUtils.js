/**
 * roleUtils.js
 *
 * Utilities for working with user roles across the PO-FES application.
 *
 * The backend and various parts of the frontend use slightly different
 * casing / spacing for the same roles (e.g. "Project Owner", "projectowner",
 * "project_owner"). normalizeRole() is the single source of truth that maps
 * all variants to a canonical lowercase token used internally.
 *
 * Canonical role tokens:
 *   'client'      - Project Owner / Client
 *   'student'     - Student
 *   'tutor'       - Teaching Staff / Tutor
 *   'coordinator' - Unit Coordinator
 *   'liaison'     - Industry Liaison
 */

// ---------------------------------------------------------------------------
// Role normalisation
// ---------------------------------------------------------------------------

/**
 * Converts any known role variant to a canonical lowercase token.
 * Unrecognised values are returned as-is (lowercased and trimmed) so that
 * callers can still do equality checks without crashing.
 *
 * @param {string} [role='']
 * @returns {'client'|'student'|'tutor'|'coordinator'|'liaison'|string}
 */
export const normalizeRole = (role = '') => {
  const cleanRole = String(role).trim().toLowerCase();

  if (['project owner', 'projectowner', 'client', 'project_owner'].includes(cleanRole)) {
    return 'client';
  }
  if (['student'].includes(cleanRole)) {
    return 'student';
  }
  if (['teaching staff', 'teachingstaff', 'tutor', 'staff', 'teaching_staff'].includes(cleanRole)) {
    return 'tutor';
  }
  if (['unit coordinator', 'unitcoordinator', 'coordinator', 'unit_coordinator'].includes(cleanRole)) {
    return 'coordinator';
  }
  if (['industry liaison', 'industryliaison', 'liaison', 'industry_liaison'].includes(cleanRole)) {
    return 'liaison';
  }

  return cleanRole;
};

// ---------------------------------------------------------------------------
// Role → route mapping
// ---------------------------------------------------------------------------

/**
 * Returns the dashboard route path for the given role.
 * Falls back to '/login' for any unrecognised role so the user is never
 * silently dropped on a non-existent page.
 *
 * @param {string} [role='']
 * @returns {string} An absolute path string (e.g. '/client-dashboard').
 */
export const roleToDashboardPath = (role = '') => {
  switch (normalizeRole(role)) {
    case 'client':      return '/client-dashboard';
    case 'student':     return '/student-dashboard';
    case 'tutor':       return '/staff-dashboard';
    case 'coordinator': return '/coordinator-dashboard';
    case 'liaison':     return '/industry-liaison-dashboard';
    default:            return '/login';
  }
};

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

/**
 * Returns true if the user's role is included in the allowedRoles list.
 * When allowedRoles is empty (the default), access is granted to everyone —
 * this matches the behaviour of ProtectedRoute when no roles are specified.
 *
 * Both the user role and each entry in allowedRoles are normalised before
 * comparison so casing differences never cause unexpected access denials.
 *
 * @param {string} userRole
 * @param {string[]} [allowedRoles=[]]
 * @returns {boolean}
 */
export const isRoleAllowed = (userRole, allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.map(normalizeRole).includes(normalizedUserRole);
};

// ---------------------------------------------------------------------------
// Display name helpers
// ---------------------------------------------------------------------------

/**
 * Returns the user's first name, trying several field name variants to
 * handle objects from different API versions.
 * Falls back to the email handle (everything before @), then to 'User'.
 *
 * @param {Object|null} user
 * @returns {string}
 */
export const getUserFirstName = (user) => {
  if (!user) return 'User';

  const firstName = user.firstName || user.firstname || user.first_name;
  if (firstName) return firstName;

  const fullName = user.name || user.fullName || user.full_name;
  if (fullName) return String(fullName).trim().split(' ')[0];

  return user.email ? String(user.email).split('@')[0] : 'User';
};

/**
 * Returns the user's full display name, trying several field name variants.
 * Combines firstName + lastName when both are present, falls back to a
 * fullName field, then the email handle, then 'User'.
 *
 * @param {Object|null} user
 * @returns {string}
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'User';

  const firstName = user.firstName || user.firstname || user.first_name;
  const lastName  = user.lastName  || user.lastname  || user.last_name;
  const fullName  = user.name      || user.fullName  || user.full_name;

  if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
  if (fullName) return fullName;
  return user.email ? String(user.email).split('@')[0] : 'User';
};
