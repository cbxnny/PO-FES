/**

 *
 * A route guard that ensures only authenticated users with an allowed role
 * can access a page.
 *
 * - Unauthenticated users (no cached profile) are redirected to /login.
 * - Authenticated users whose role is not in the allowedRoles list are
 *   redirected to their own dashboard instead of showing a 403 page.
 * - When allowedRoles is empty (default), any authenticated user may access
 *   the route regardless of role.
 *
 * NOTE: getCurrentUser() reads from an in-memory cache populated by
 * initAuth() in main.jsx — it does not itself check sessionStorage/Supabase.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['Teaching Staff', 'Tutor']}>
 *     <TutorFeedback />
 *   </ProtectedRoute>
 */

import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { isRoleAllowed, roleToDashboardPath } from '../utils/roleUtils';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isRoleAllowed(user.role, allowedRoles)) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;