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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/confirmation" element={<ConfirmationMessage />} />
        <Route path="/client-dashboard" element={<ProjectOwnerDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/staff-dashboard" element={<IndustryLiaisonDashboard />} />
        <Route path="/coordinator-dashboard" element={<UnitCoordinatorDashboard />} />
        <Route path="/submit-feedback" element={<SubmitFeedback />} />
        <Route path="/edit-dashboard" element={<EditDashboard />} />

        {/* Legacy route aliases */}
        <Route path="/project-owner-dashboard" element={<Navigate to="/client-dashboard" replace />} />
        <Route path="/industry-liaison-dashboard" element={<Navigate to="/staff-dashboard" replace />} />
        <Route path="/unit-coordinator-dashboard" element={<Navigate to="/coordinator-dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
