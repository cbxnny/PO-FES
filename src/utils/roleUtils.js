/**
 * roleUtils.js
 *
 * Utilities for working with user roles across the PO-FES application.
 *
 * The backend and various parts of the frontend use slightly different
 * casing / spacing for the same roles. normalizeRole() maps all variants
 * to a canonical lowercase token used internally.
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

export const roleToDashboardPath = (role = '') => {
  switch (normalizeRole(role)) {
    case 'client':
      return '/client-dashboard';

    case 'student':
      return '/student-dashboard';

    case 'tutor':
      return '/staff-dashboard';

    case 'coordinator':
      return '/coordinator-dashboard';

    case 'liaison':
      return '/industry-liaison-dashboard';

    default:
      return '/login';
  }
};

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export const isRoleAllowed = (userRole, allowedRoles = []) => {
  if (!allowedRoles.length) return true;

  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.map(normalizeRole).includes(normalizedUserRole);
};

// ---------------------------------------------------------------------------
// Display name helpers
// ---------------------------------------------------------------------------

const cleanNamePart = (value) => {
  if (value === null || value === undefined) return '';

  const cleaned = String(value).trim();

  if (!cleaned) return '';

  const lower = cleaned.toLowerCase();

  if (
    lower === 'empty' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'n/a' ||
    lower === 'na'
  ) {
    return '';
  }

  return cleaned;
};

const getEmailHandle = (user) => {
  const email = cleanNamePart(user?.email);
  if (!email) return '';

  return email.split('@')[0];
};

const toTitleCase = (value) => {
  const cleaned = cleanNamePart(value);
  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Returns the user's first name.
 * Falls back to full name, then email handle, then 'User'.
 */
export const getUserFirstName = (user) => {
  if (!user) return 'User';

  const firstName = cleanNamePart(user.firstName || user.firstname || user.first_name);

  if (firstName) {
    return toTitleCase(firstName);
  }

  const fullName = cleanNamePart(user.name || user.fullName || user.full_name);

  if (fullName) {
    return toTitleCase(fullName.split(' ')[0]);
  }

  const emailHandle = getEmailHandle(user);

  if (emailHandle) {
    return toTitleCase(emailHandle);
  }

  return 'User';
};

/**
 * Returns the user's full display name.
 * Falls back to full name, then email handle, then 'User'.
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'User';

  const firstName = cleanNamePart(user.firstName || user.firstname || user.first_name);
  const lastName = cleanNamePart(user.lastName || user.lastname || user.last_name);
  const fullName = cleanNamePart(user.name || user.fullName || user.full_name);

  const combinedName = `${firstName} ${lastName}`.trim();

  if (combinedName) {
    return toTitleCase(combinedName);
  }

  if (fullName) {
    return toTitleCase(fullName);
  }

  const emailHandle = getEmailHandle(user);

  if (emailHandle) {
    return toTitleCase(emailHandle);
  }

  return 'User';
};