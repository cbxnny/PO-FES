import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProjectOwnerDashboard from './pages/ProjectOwnerDashboard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import IndustryLiaisonDashboard from './pages/IndustryLiaisonDashboard';
import UnitCoordinatorDashboard from './pages/UnitCoordinatorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/project-owner-dashboard" element={<ProjectOwnerDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/industry-liaison-dashboard" element={<IndustryLiaisonDashboard />} />
        <Route path="/unit-coordinator-dashboard" element={<UnitCoordinatorDashboard />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
