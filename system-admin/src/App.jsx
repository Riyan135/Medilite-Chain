import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import AutoLoginPage from './pages/SignInPage';
import AdminDashboard from './pages/AdminDashboard';
import AccessControl from './pages/AccessControl';
import UserGovernance from './pages/UserGovernance';
import SystemMonitoring from './pages/SystemMonitoring';
import AuditLogs from './pages/AuditLogs';
import NotificationCenter from './pages/NotificationCenter';
import ReportsCenter from './pages/ReportsCenter';
import Integrations from './pages/Integrations';
import Policies from './pages/Policies';
import Backups from './pages/Backups';
import ContentCenter from './pages/ContentCenter';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'ADMIN') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<AutoLoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/access-control" 
            element={
              <ProtectedRoute>
                <AccessControl />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-governance" 
            element={
              <ProtectedRoute>
                <UserGovernance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/system-monitoring" 
            element={
              <ProtectedRoute>
                <SystemMonitoring />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audit-logs" 
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportsCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/integrations" 
            element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/policies" 
            element={
              <ProtectedRoute>
                <Policies />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/backups" 
            element={
              <ProtectedRoute>
                <Backups />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/content-center" 
            element={
              <ProtectedRoute>
                <ContentCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
