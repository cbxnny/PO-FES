import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = getCurrentUser();
    const token = sessionStorage.getItem('po_fes_token');

    // If the user hasn't logged in, redirect them back to the login page
    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    // If allowedRoles is specified, check if user has permission
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their default role-based dashboard
        switch (user.role) {
            case 'Project Owner':
                return <Navigate to="/client-dashboard" replace />;
            case 'Student':
                return <Navigate to="/student-dashboard" replace />;
            case 'Industry Liaison':
                return <Navigate to="/staff-dashboard" replace />;
            case 'Unit Coordinator':
                return <Navigate to="/coordinator-dashboard" replace />;
            default:
                return <Navigate to="/client-dashboard" replace />;
        }
    }

    // Otherwise, allow them to view the page
    return children;
};

export default ProtectedRoute;
