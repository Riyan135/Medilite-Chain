import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDetails from './pages/PatientDetails';
import HealthTimeline from './pages/HealthTimeline';
import MedicineReminders from './pages/MedicineReminders';
import QRProfile from './pages/QRProfile';
import Records from './pages/Records';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import SymptomChecker from './pages/SymptomChecker';
import EmergencySOS from './pages/EmergencySOS';
import FamilyProfiles from './pages/FamilyProfiles';
import AppointmentBooking from './pages/AppointmentBooking';
import Consultations from './pages/Consultations';
import ScanRedirect from './pages/ScanRedirect';
import PublicEmergencyProfile from './pages/PublicEmergencyProfile';
import { SocketProvider } from './context/SocketContext';

const systemAdminUrl = import.meta.env.VITE_SYSTEM_ADMIN_URL || 'http://localhost:5175';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardMap = {
      'PATIENT': '/dashboard',
      'DOCTOR': '/doctor-dashboard',
      'ADMIN': systemAdminUrl,
    };

    const targetPath = dashboardMap[user.role] || '/';
    
    if (targetPath.startsWith('http')) {
      window.location.href = targetPath;
      return null;
    }

    return <Navigate to={targetPath} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    const dashboardMap = {
      'PATIENT': '/dashboard',
      'DOCTOR': '/doctor-dashboard',
      'ADMIN': systemAdminUrl,
    };

    if (user.role === 'ADMIN') {
      window.location.href = dashboardMap['ADMIN'];
      return null;
    }

    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <SocketProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/sign-in/*"
            element={
              <PublicRoute>
                <SignInPage />
              </PublicRoute>
            }
          />
          <Route
            path="/sign-up/*"
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <PatientDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <PatientDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/timeline/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <HealthTimeline />
              </PrivateRoute>
            }
          />
          <Route
            path="/records/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <Records />
              </PrivateRoute>
            }
          />
          <Route
            path="/reminders/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <MedicineReminders />
              </PrivateRoute>
            }
          />

          <Route
            path="/family-profiles"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <FamilyProfiles />
              </PrivateRoute>
            }
          />

          <Route
            path="/qr/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <QRProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/symptom-checker/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <SymptomChecker />
              </PrivateRoute>
            }
          />
          <Route
            path="/emergency/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <EmergencySOS />
              </PrivateRoute>
            }
          />
          <Route
            path="/book-appointment/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <AppointmentBooking />
              </PrivateRoute>
            }
          />
          <Route
            path="/consultations/:memberId?"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <Consultations />
              </PrivateRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor-dashboard"
            element={
              <PrivateRoute allowedRoles={['DOCTOR']}>
                <DoctorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/patient/:id"
            element={
              <PrivateRoute allowedRoles={['DOCTOR']}>
                <PatientDetails />
              </PrivateRoute>
            }
          />


          {/* Scan Redirect Route */}
          <Route path="/scan/:id" element={<ScanRedirect />} />
          
          {/* Public Emergency Profile */}
          <Route path="/emergency-profile/:id" element={<PublicEmergencyProfile />} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
