import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const AdminViewAsHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      toast.error('Invalid viewing session');
      navigate('/sign-in');
      return;
    }

    try {
      const decodedData = JSON.parse(atob(dataParam));
      const { userId, role, adminToken, adminInfo } = decodedData;

      if (!userId || !role || !adminToken) {
        throw new Error('Incomplete data');
      }

      // Save admin session to AuthContext in the client app
      const mediliteUser = {
        ...adminInfo,
        token: adminToken,
        role: 'ADMIN', // Ensure role is set correctly
        viewAsId: userId // Store the ID we are viewing
      };

      login(mediliteUser);

      // Redirect to the appropriate dashboard
      if (role === 'PATIENT') {
        navigate(`/dashboard?viewAs=${userId}`);
      } else if (role === 'DOCTOR') {
        navigate(`/doctor-dashboard?viewAs=${userId}`);
      } else {
        toast.error('Unsupported role for viewing');
        navigate('/');
      }
      
      toast.success('Admin view session started');
    } catch (e) {
      console.error('Error handling admin view-as:', e);
      toast.error('Failed to start viewing session');
      navigate('/sign-in');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-slate-900">Starting Admin Session...</h2>
        <p className="text-slate-500 mt-2">Preparing the dashboard for your review.</p>
      </div>
    </div>
  );
};

export default AdminViewAsHandler;
