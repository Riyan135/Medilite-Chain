import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowLeft, Mail, User, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

const SignInPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSendOtp = async () => {
    setError('');
    setSendingOtp(true);

    try {
      await api.post('/auth/request-otp', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      setOtpSent(true);
      toast.success(`OTP sent to ${formData.email}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', formData);
      const { user, token } = response.data;

      login({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      });

      toast.success(`Welcome to the portal, ${user.name}`);

      if (user.role === 'DOCTOR') navigate('/doctor-dashboard');
      else if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-float pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/20 to-blue-400/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-md animate-slide-up-fade">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-6 group bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-slate-200/50 shadow-sm hover:shadow-md">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-bold">Back to Home</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-sm shadow-blue-900/5">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">Medi<span className="text-blue-600">Lite</span></span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Portal Login</h1>
          <p className="text-slate-500 font-medium">Enter your details, receive an OTP by email, and continue securely.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white/60">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 tracking-wide">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 tracking-wide">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 tracking-wide">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || !formData.name || !formData.phone || !formData.email}
              className="w-full bg-slate-100 text-slate-800 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 tracking-wide">OTP</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={formData.otp}
                  onChange={(e) => updateField('otp', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900 tracking-[0.4em]"
                  placeholder="1234"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !otpSent}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/25 transition-all duration-300 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none flex items-center justify-center"
            >
              {loading ? 'Verifying OTP...' : 'Go To Portal'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Need a new account?{' '}
              <Link to="/sign-up" className="text-blue-600 font-bold hover:text-blue-700">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
