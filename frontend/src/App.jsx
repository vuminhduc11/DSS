import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WorkflowPage from './pages/WorkflowPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import StrategyPage from './pages/StrategyPage';
import RLFMPage from './pages/RLFMPage';
// DataManagementPage consolidated
import DataPage from './pages/DataPage';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is restricted, redirect to home (DataPage) which handles its own visibility
    // or stay on home if already there.
    // For retail_system trying to access /analysis, redirect to /
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <DataPage />
              </ProtectedRoute>
            } />
            <Route path="/analysis" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <AnalysisPage />
              </ProtectedRoute>
            } />
            <Route path="/workflow" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <WorkflowPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/rlfm" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RLFMPage />
              </ProtectedRoute>
            } />

            {/* Restored Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/strategy" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <StrategyPage />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={<Navigate to="/" />} />
            <Route path="/clustering" element={<Navigate to="/" />} />
            {/* DataManagementPage Removed - Consolidated into DataPage */}
            <Route path="/history" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <HistoryPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
