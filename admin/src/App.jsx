import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import AutoLoginPage from './pages/SignInPage';
import AdminDashboard from './pages/AdminDashboard';
import Appointments from './pages/Appointments';
import Consultations from './pages/Consultations';
import Medicines from './pages/Medicines';
import PatientDetails from './pages/PatientDetails';
import Profile from './pages/Profile';
import Records from './pages/Records';
import Settings from './pages/Settings';
import DoctorSignUpPage from './pages/DoctorSignUpPage';
import DoctorScanner from './pages/DoctorScanner';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="w-full"
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'DOCTOR') {
    return <Navigate to="/login" />;
  }
  
  return <PageWrapper>{children}</PageWrapper>;
};

const LoginRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user?.role === 'DOCTOR') {
    return <Navigate to="/dashboard" replace />;
  }

  return <AutoLoginPage />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
          path="/consultations" 
          element={
            <ProtectedRoute>
              <Consultations />
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
        <Route 
          path="/scan" 
          element={
            <ProtectedRoute>
              <DoctorScanner />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" gutter={8} toastOptions={{
          style: {
            borderRadius: '20px',
            background: '#1e293b',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            padding: '12px 24px',
          }
        }} />
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
