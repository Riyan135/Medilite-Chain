import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

const AutoLoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const performAutoLogin = async (retries = 3) => {
      // If already logged in, go to dashboard
      if (user) {
        navigate('/dashboard');
        return;
      }

      try {
        const response = await api.post('/auth/login', {
          email: 'admin@medilite.com',
          password: 'AdminPassword123'
        });
        
        const { user: loggedInUser, token } = response.data;
        
        login({ 
          id: loggedInUser.id, 
          email: loggedInUser.email, 
          name: loggedInUser.name,
          role: loggedInUser.role,
          token: token 
        });
        
        toast.success('System Authenticated: ' + loggedInUser.name);
        navigate('/dashboard');
      } catch (err) {
        if (retries > 0) {
          console.log(`Login failed, retrying in 2s... (${retries} retries left)`);
          setTimeout(() => performAutoLogin(retries - 1), 2000);
        } else {
          const errorMsg = err.response?.data?.error || 'Authentication failed';
          setError(errorMsg);
          toast.error('System access denied: ' + errorMsg);
        }
      }
    };

    performAutoLogin();
  }, [login, navigate, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6 animate-pulse">
          <Activity className="h-12 w-12 text-blue-600" />
          <span className="text-3xl font-bold text-gray-900 tracking-tight">MediLite</span>
        </div>
        
        {error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-sm">
            <h2 className="font-bold text-lg mb-2">Access Error</h2>
            <p className="text-sm font-medium">{error}</p>
            <p className="mt-4 text-xs text-red-400">Please contact the system administrator or verify the database seed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Initializing System Portal</h2>
            <p className="text-gray-500 font-medium">Bypassing manual authentication...</p>
            <div className="flex justify-center mt-6">
              <div className="h-8 w-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoLoginPage;
