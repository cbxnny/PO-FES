import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { roleToDashboardPath } from '../utils/roleUtils';

const PublicRoute = ({ children }) => {
  const user = getCurrentUser();
  const token = sessionStorage.getItem('po_fes_token');

  if (user) {
    return <Navigate to={roleToDashboardPath(user.role)} replace />;
  }

  return children;
};

export default PublicRoute;