import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ConfirmationMessage from './pages/ConfirmationMessage';
import ProjectOwnerDashboard from './pages/ProjectOwnerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import IndustryLiaisonDashboard from './pages/IndustryLiaisonDashboard';
import UnitCoordinatorDashboard from './pages/UnitCoordinatorDashboard';
import SubmitFeedback from './pages/SubmitFeedback';
import FeedbackTimeline from './pages/FeedbackTimeline';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />

        <Route
          path="/sign-up"
          element={<PublicRoute><SignUp /></PublicRoute>}
        />

        <Route
          path="/confirmation"
          element={<ConfirmationMessage />}
        />

        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Project Owner', 'Client']}>
              <ProjectOwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Teaching Staff', 'Tutor', 'Staff']}>
              <TutorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Unit Coordinator', 'Coordinator']}>
              <UnitCoordinatorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/industry-liaison-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Industry Liaison', 'Liaison']}>
              <IndustryLiaisonDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/submit-feedback/:teamId?"
          element={
            <ProtectedRoute allowedRoles={['Project Owner', 'Client']}>
              <SubmitFeedback />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback-timeline/:teamId"
          element={
            <ProtectedRoute>
              <FeedbackTimeline />
            </ProtectedRoute>
          }
        />

        {/* Legacy route aliases */}
        <Route path="/project-owner-dashboard" element={<Navigate to="/client-dashboard" replace />} />
        <Route path="/dashboard/client" element={<Navigate to="/client-dashboard" replace />} />
        <Route path="/dashboard/teaching-staff" element={<Navigate to="/staff-dashboard" replace />} />
        <Route path="/dashboard/unit-coordinator" element={<Navigate to="/coordinator-dashboard" replace />} />
        <Route path="/dashboard/industry-liaison" element={<Navigate to="/industry-liaison-dashboard" replace />} />
        <Route path="/unit-coordinator-dashboard" element={<Navigate to="/coordinator-dashboard" replace />} />
        <Route path="/liaison-dashboard" element={<Navigate to="/industry-liaison-dashboard" replace />} />

        {/* Removed pages now redirect safely */}
        <Route path="/tutor-feedback/:teamId" element={<Navigate to="/staff-dashboard" replace />} />
        <Route path="/client-comment/:teamId" element={<Navigate to="/staff-dashboard" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;