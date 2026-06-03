import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
    const user = getCurrentUser();
    const token = sessionStorage.getItem('po_fes_token');

    // If the user hasn't logged in, redirect them back to the login page
    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, allow them to view the page
    return children;
};

export default ProtectedRoute;
