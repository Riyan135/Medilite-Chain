import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, LockKeyhole, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!normalizedEmail || !password.trim()) {
      toast.error('Enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: normalizedEmail,
        password: password.trim(),
      });

      const { user: loggedInUser, token } = response.data;

      if (loggedInUser.role !== 'ADMIN') {
        toast.error('Only admin accounts can use this portal');
        setLoading(false);
        return;
      }

      login({
        id: loggedInUser.id,
        email: loggedInUser.email,
        name: loggedInUser.name,
        role: loggedInUser.role,
        token,
      });

      toast.success(`Welcome back, ${loggedInUser.name}`);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Authentication failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-100 text-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#e0f2fe_24%,#dbeafe_50%,#ede9fe_76%,#fef3c7_100%)]" />
      <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_center,rgba(255,255,255,0.72),transparent_58%)]" />
      <div className="absolute -top-20 left-[6%] h-80 w-80 rounded-full bg-cyan-300/30 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-8rem] right-[4%] h-[28rem] w-[28rem] rounded-full bg-violet-300/25 blur-[150px] animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute top-[14%] right-[12%] h-32 w-32 rounded-full border border-white/40 bg-white/15 animate-[spin_24s_linear_infinite]" />
      <div className="absolute bottom-[18%] left-[11%] h-20 w-20 rounded-full bg-white/35 shadow-[0_0_40px_rgba(255,255,255,0.75)] animate-[bounce_7s_ease-in-out_infinite]" />
      <div className="absolute top-6 left-6 md:top-10 md:left-10 rounded-[2.4rem] border border-white/65 bg-white/55 p-3 md:p-4 shadow-[0_30px_85px_rgba(59,130,246,0.18)] backdrop-blur-xl transition-transform duration-700 hover:-translate-y-2 hover:rotate-1">
        <img
          src="/doctor-pocket.jpg"
          alt="Doctor coat pocket with tools"
          className="h-44 w-56 md:h-64 md:w-80 rounded-[1.9rem] object-cover shadow-xl animate-[pulse_9s_ease-in-out_infinite]"
        />
      </div>
      <div className="pointer-events-none absolute right-4 bottom-4 md:right-10 md:bottom-8 rounded-[2.25rem] border border-white/65 bg-white/55 p-3 md:p-4 shadow-[0_28px_80px_rgba(59,130,246,0.16)] backdrop-blur-xl transition-transform duration-700">
        <img
          src="/doctor-stethoscope.jpg"
          alt="Stethoscope heart"
          className="h-28 w-40 md:h-44 md:w-60 rounded-[1.6rem] object-cover shadow-lg animate-[pulse_8s_ease-in-out_infinite]"
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 sm:p-10">
        <div className="grid w-full max-w-6xl lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="hidden lg:block space-y-8 transition-all duration-700">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/55 px-5 py-2 text-sm font-semibold text-sky-700 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.4)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(59,130,246,0.18)]">
              <Sparkles className="h-4 w-4 text-sky-500" />
              Credential-based admin access
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl xl:text-6xl font-black leading-tight tracking-tight">
                Step into the
                <span className="block bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                  MediLite System Admin
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-600 leading-relaxed">
                Sign in with the configured admin email and password to access the platform-governance portal for monitoring, user management, policies, and system controls.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard title="Credential Access" description="Use the configured system-admin email and password to access the governance console." />
              <InfoCard title="Admin Only" description="This workspace is dedicated to platform administration and is restricted to admin accounts." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/68 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(59,130,246,0.18)] transition-all duration-700 hover:-translate-y-1 hover:shadow-[0_36px_100px_rgba(99,102,241,0.2)]">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/80 bg-gradient-to-br from-sky-100 to-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-500 hover:scale-105 hover:rotate-3">
                <LockKeyhole className="h-10 w-10 text-sky-600" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">System Admin Sign In</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Enter your admin email and password to continue to the admin portal.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Email Address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-sky-500 transition-colors duration-300 group-focus-within:text-blue-700" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                    placeholder="admin@medilite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Password
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <ShieldCheck className="h-5 w-5 text-violet-500 transition-colors duration-300 group-focus-within:text-indigo-700" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-12 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-400/70 focus:bg-white focus:ring-4 focus:ring-violet-400/10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-violet-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 px-5 py-4 font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_45px_rgba(59,130,246,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing In...' : 'Go To Dashboard'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <div className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm text-slate-600">
                Use the configured system-admin credentials from the server environment to access this portal.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ title, description }) => (
  <div className="rounded-3xl border border-white/70 bg-white/52 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/70 hover:shadow-[0_20px_60px_rgba(59,130,246,0.14)]">
    <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">{title}</p>
    <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
  </div>
);

export default SignInPage;
