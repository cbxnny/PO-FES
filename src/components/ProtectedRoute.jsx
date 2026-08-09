import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { isRoleAllowed, roleToDashboardPath } from '../utils/roleUtils';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = getCurrentUser();
  const token = sessionStorage.getItem('po_fes_token');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isRoleAllowed(user.role, allowedRoles)) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;