import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowLeft, Mail, Lock, Phone, User, Eye, EyeOff, Droplets } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

const SignUpPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', bloodGroup: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
      });

      const { user, token } = response.data;

      register({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token,
      });

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 lg:py-12 relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/30 to-indigo-400/30 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 animate-float pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-blue-400/20 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2 animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-[500px] animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-4 group bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-slate-200/50 shadow-sm hover:shadow-md">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-bold">Back to Home</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-sm shadow-blue-900/5">
              <Activity className="h-7 w-7 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Medi<span className="text-blue-600">Lite</span></span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Sign Up for MediLite</h1>
          <p className="text-slate-500 font-medium text-sm">Create your patient account with your name, email, phone number, and password.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white/60">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                {error}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">Blood Group</label>
              <div className="relative group">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
                <select
                  required
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium appearance-none ${formData.bloodGroup ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  <option value="" disabled>Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-medium text-slate-900"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/25 transition-all duration-300 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none flex items-center justify-center mt-4"
            >
              {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-blue-600 font-bold hover:text-blue-700">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
