/**
 * PublicRoute.jsx
 *
 * A route guard that prevents already-authenticated users from accessing
 * public-only pages (Login, Sign Up).
 *
 * If a valid session exists, the user is redirected straight to their
 * role-appropriate dashboard so they don't land on a login page they don't
 * need.
 *
 * Usage:
 *   <PublicRoute><Login /></PublicRoute>
 */

import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { roleToDashboardPath } from '../utils/roleUtils';

const PublicRoute = ({ children }) => {
  const user  = getCurrentUser();
  const token = sessionStorage.getItem('po_fes_token');

  if (user && token) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />;
  }

  return children;
};

export default PublicRoute;
