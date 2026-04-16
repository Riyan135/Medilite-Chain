import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import AutoLoginPage from './pages/SignInPage';
import AdminDashboard from './pages/AdminDashboard';
import Appointments from './pages/Appointments';
import Medicines from './pages/Medicines';
import PatientDetails from './pages/PatientDetails';
import Profile from './pages/Profile';
import Records from './pages/Records';
import Settings from './pages/Settings';
import DoctorSignUpPage from './pages/DoctorSignUpPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'DOCTOR') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const LoginRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user?.role === 'DOCTOR') {
    return <Navigate to="/dashboard" replace />;
  }

  return <AutoLoginPage />;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/sign-up" element={<DoctorSignUpPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/appointments" 
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medicines" 
            element={
              <ProtectedRoute>
                <Medicines />
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
          <Route 
            path="/patient/:id" 
            element={
              <ProtectedRoute>
                <PatientDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/records" 
            element={
              <ProtectedRoute>
                <Records />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
