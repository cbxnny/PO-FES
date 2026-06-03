import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

const PublicRoute = ({ children }) => {
    const user = getCurrentUser();
    const token = sessionStorage.getItem('po_fes_token');

    // If the user is already logged in, redirect them to their respective dashboard
    if (user && token) {
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

    // Otherwise, render the requested page (login, signup, etc.)
    return children;
};

export default PublicRoute;
