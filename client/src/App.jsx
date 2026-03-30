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
    // Redirect to their appropriate dashboard if they try to access a role-restricted page
    const dashboardMap = {
      'PATIENT': '/dashboard',
      'DOCTOR': '/doctor-dashboard',
      'ADMIN': 'http://localhost:5174'
    };

    if (user.role === 'ADMIN') {
      window.location.href = dashboardMap['ADMIN'];
      return null;
    }

    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
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
      'ADMIN': 'http://localhost:5174'
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
            path="/dashboard/:memberId"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <PatientDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <HealthTimeline />
              </PrivateRoute>
            }
          />
          <Route
            path="/records"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <Records />
              </PrivateRoute>
            }
          />
          <Route
            path="/reminders"
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
            path="/qr"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <QRProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/symptom-checker"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <SymptomChecker />
              </PrivateRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <EmergencySOS />
              </PrivateRoute>
            }
          />
          <Route
            path="/book-appointment"
            element={
              <PrivateRoute allowedRoles={['PATIENT']}>
                <AppointmentBooking />
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
            path="/doctor/patient/:clerkId"
            element={
              <PrivateRoute allowedRoles={['DOCTOR']}>
                <PatientDetails />
              </PrivateRoute>
            }
          />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
