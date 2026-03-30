import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { name: adminName, password });
      const { user: loggedInUser, token } = response.data;
      
      if (loggedInUser.role !== 'ADMIN') {
        toast.error('Access Denied: Not an admin account');
        setLoading(false);
        return;
      }

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
      const errorMsg = err.response?.data?.error || 'Authentication failed';
      toast.error('System access denied: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white relative z-10 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-white/30 shadow-inner">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Admin Portal</h2>
          <p className="text-blue-100 font-medium text-sm">Secure access for system administrators</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Admin Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
              </div>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="Enter admin name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-indigo-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:pointer-events-none text-lg"
          >
            {loading ? 'Authenticating...' : 'Go To Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
