/**
 * ProtectedRoute.jsx
 *
 * A route guard that ensures only authenticated users with an allowed role
 * can access a page.
 *
 * - Unauthenticated users (no session or token) are redirected to /login.
 * - Authenticated users whose role is not in the allowedRoles list are
 *   redirected to their own dashboard instead of showing a 403 page.
 * - When allowedRoles is empty (default), any authenticated user may access
 *   the route regardless of role.
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
  const user  = getCurrentUser();
  const token = sessionStorage.getItem('po_fes_token');

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (!isRoleAllowed(user.role, allowedRoles)) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
