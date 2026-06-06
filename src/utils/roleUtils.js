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

export const isRoleAllowed = (userRole, allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.map(normalizeRole).includes(normalizedUserRole);
};

export const getUserFirstName = (user) => {
  if (!user) return 'User';
  const firstName = user.firstName || user.firstname || user.first_name;
  if (firstName) return firstName;

  const fullName = user.name || user.fullName || user.full_name;
  if (fullName) return String(fullName).trim().split(' ')[0];

  return user.email ? String(user.email).split('@')[0] : 'User';
};

export const getUserDisplayName = (user) => {
  if (!user) return 'User';

  const firstName = user.firstName || user.firstname || user.first_name;
  const lastName = user.lastName || user.lastname || user.last_name;
  const fullName = user.name || user.fullName || user.full_name;

  if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
  if (fullName) return fullName;
  return user.email ? String(user.email).split('@')[0] : 'User';
};
