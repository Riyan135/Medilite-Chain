import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, ArrowLeft, MailCheck, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const SignUpOtpPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = useMemo(
    () => (searchParams.get('email') || location.state?.email || '').trim().toLowerCase(),
    [location.state?.email, searchParams]
  );
  const name = location.state?.name?.trim() || 'there';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Signup email is missing. Please start the signup flow again.');
      return;
    }

    if (otp.trim().length !== 4) {
      setError('Enter the 4-digit OTP sent to your email.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register/verify-otp', {
        email,
        otp: otp.trim(),
      });

      const { user } = response.data;
      register({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        doctorId: user.doctorId,
        specialization: user.specialization,
      });

      toast.success(response.data.message || 'Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to verify OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:py-12 relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/30 to-indigo-400/30 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 animate-float pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2 animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-[500px] animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
        <div className="text-center mb-6">
          <Link to="/sign-up" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-4 group bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-slate-200/50 shadow-sm hover:shadow-md">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-bold">Back to Sign Up</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-sm shadow-blue-900/5">
              <Activity className="h-7 w-7 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Medi<span className="text-blue-600">Lite</span></span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Verify Your OTP</h1>
          <p className="text-slate-500 font-medium text-sm">
            We sent a 4-digit OTP to <span className="font-bold text-slate-700">{email || 'your email'}</span>. Enter it to finish creating your account.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white/60">
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800">
            <div className="flex items-center gap-3">
              <MailCheck className="h-5 w-5 shrink-0 text-blue-600" />
              <p>
                Hi {name}, your signup stays pending until this OTP is verified.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="one-time-code">
            {error ? (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                {error}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wider uppercase">One-Time Password</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none font-semibold text-slate-900 tracking-[0.45em]"
                  placeholder="1234"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/25 transition-all duration-300 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none flex items-center justify-center mt-4"
            >
              {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Need a new code? <Link to="/sign-up" className="text-blue-600 font-bold hover:text-blue-700">Go back and request another OTP</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpOtpPage;
