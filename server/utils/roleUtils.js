/**
 * roleUtils.js (server)
 *
 * Backend mirror of src/utils/roleUtils.js normalizeRole().
 * Keep in sync if new roles are added. 
 */

const normalizeRole = (role = '') => {
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

module.exports = { normalizeRole };