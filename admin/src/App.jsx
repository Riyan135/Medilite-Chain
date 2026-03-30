import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import AutoLoginPage from './pages/SignInPage';
import AdminDashboard from './pages/AdminDashboard';
import PatientDetails from './pages/PatientDetails';
import Records from './pages/Records';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'ADMIN') {
    // If somehow a non-admin gets here, logout and redirect
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
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
