import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ScanRedirect = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // If not logged in, take them to the public emergency profile
      // This prevents the redirect to login for first responders
      navigate(`/emergency-profile/${id}`);
      return;
    }

    if (user.role === 'DOCTOR') {
      navigate(`/doctor/patient/${id}`);
    } else if (user.role === 'PATIENT') {
      navigate(`/dashboard/${id}`);
    } else {
      navigate('/');
    }
  }, [id, user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-bold">Redirecting to profile...</p>
      </div>
    </div>
  );
};

export default ScanRedirect;
