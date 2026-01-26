import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { TechnicianDashboard } from './components/technician/TechnicianDashboard';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { DashboardPage } from './pages/DashboardPage';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// Role-based Dashboard Router
const DashboardRouter = () => {
  const { profile } = useAuth();

  switch (profile?.role) {
    case 'technician':
      return <TechnicianDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'admin':
      return <DashboardPage />;
    case 'warehouse_staff':
      return <DashboardPage />;
    default:
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Unknown Role
            </h1>
            <p className="text-gray-600">
              Your user role ({profile?.role || 'undefined'}) is not recognized.
            </p>
          </div>
        </div>
      );
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />

        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/technician"
            element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor"
            element={
              <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={['admin', 'supervisor', 'warehouse_staff']}
              >
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
