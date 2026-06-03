import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ConfirmationMessage from './pages/ConfirmationMessage';
import ProjectOwnerDashboard from './pages/ProjectOwnerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import IndustryLiaisonDashboard from './pages/IndustryLiaisonDashboard';
import UnitCoordinatorDashboard from './pages/UnitCoordinatorDashboard';
import SubmitFeedback from './pages/SubmitFeedback';
import EditDashboard from './pages/EditDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/sign-up" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/confirmation" element={<ConfirmationMessage />} />
        
        {/* Protected Routes */}
        <Route path="/client-dashboard" element={<ProtectedRoute><ProjectOwnerDashboard /></ProtectedRoute>} />
        <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/staff-dashboard" element={<ProtectedRoute><IndustryLiaisonDashboard /></ProtectedRoute>} />
        <Route path="/coordinator-dashboard" element={<ProtectedRoute><UnitCoordinatorDashboard /></ProtectedRoute>} />
        <Route path="/submit-feedback" element={<ProtectedRoute><SubmitFeedback /></ProtectedRoute>} />
        <Route path="/edit-dashboard" element={<ProtectedRoute><EditDashboard /></ProtectedRoute>} />

        {/* Legacy route aliases */}
        <Route path="/project-owner-dashboard" element={<Navigate to="/client-dashboard" replace />} />
        <Route path="/industry-liaison-dashboard" element={<Navigate to="/staff-dashboard" replace />} />
        <Route path="/unit-coordinator-dashboard" element={<Navigate to="/coordinator-dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
