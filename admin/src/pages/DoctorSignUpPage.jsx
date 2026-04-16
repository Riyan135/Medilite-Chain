import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const DoctorSignUpPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    password: '',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [loadingAction, setLoadingAction] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    const { name, email, phone, specialization, password } = formData;

    if (!name.trim() || !email.trim() || !phone.trim() || !specialization.trim() || !password.trim()) {
      toast.error('Enter all doctor details before requesting OTP');
      return;
    }

    if (password.trim().length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoadingAction('send');
    try {
      await api.post('/auth/doctor/sign-up/request-otp', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        specialization: specialization.trim(),
        password: password.trim(),
      });
      setOtpSent(true);
      toast.success(`Doctor OTP sent to ${email.trim().toLowerCase()}`);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.doctorId) {
        toast.error(`Doctor already exists. Use Doctor ID ${errorData.doctorId} to log in.`);
        navigate('/login');
        return;
      }
      toast.error(errorData?.error || 'Failed to send sign-up OTP');
    } finally {
      setLoadingAction('');
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!formData.otp.trim()) {
      toast.error('Enter the OTP sent to your email');
      return;
    }

    setLoadingAction('verify');
    try {
      const response = await api.post('/auth/doctor/sign-up/verify-otp', {
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp.trim(),
      });

      const { user, token, doctorId: issuedDoctorId } = response.data;
      setDoctorId(issuedDoctorId);

      login({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
        doctorId: user.doctorId,
        specialization: user.specialization,
      });

      toast.success(`Doctor account created. Your Doctor ID is ${issuedDoctorId}`);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify sign-up OTP');
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#e0f2fe_24%,#dbeafe_50%,#ede9fe_76%,#fef3c7_100%)]" />
      <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_center,rgba(255,255,255,0.72),transparent_58%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/72 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(59,130,246,0.18)]">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/80 bg-gradient-to-br from-sky-100 to-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <Stethoscope className="h-10 w-10 text-sky-600" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Doctor Sign Up</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">
              Create your doctor account, verify it by OTP, and receive your permanent Doctor ID on screen and by email.
            </p>
          </div>

          <form onSubmit={handleVerify} className="grid gap-5 md:grid-cols-2">
            <Field label="Doctor Name" icon={<UserRound className="h-5 w-5 text-sky-500" />}>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                placeholder="Enter doctor name"
                required
              />
            </Field>

            <Field label="Email Address" icon={<Mail className="h-5 w-5 text-sky-500" />}>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                placeholder="doctor@medilite.com"
                required
              />
            </Field>

            <Field label="Phone Number" icon={<Phone className="h-5 w-5 text-sky-500" />}>
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                placeholder="Enter phone number"
                required
              />
            </Field>

            <Field label="Specialization" icon={<BadgeCheck className="h-5 w-5 text-sky-500" />}>
              <input
                type="text"
                value={formData.specialization}
                onChange={(event) => updateField('specialization', event.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                placeholder="Cardiology, Orthopedics, etc."
                required
              />
            </Field>

            <Field label="Password" icon={<Lock className="h-5 w-5 text-violet-500" />}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(event) => updateField('password', event.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-12 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-400/70 focus:bg-white focus:ring-4 focus:ring-violet-400/10"
                placeholder="Minimum 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-violet-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </Field>

            <div className="md:col-span-2">
              <Field label="One-Time Password" icon={<ShieldCheck className="h-5 w-5 text-violet-500" />}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={formData.otp}
                  onChange={(event) => updateField('otp', event.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold tracking-[0.35em] text-slate-800 placeholder:tracking-normal placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-400/70 focus:bg-white focus:ring-4 focus:ring-violet-400/10"
                  placeholder="Enter OTP"
                  required
                />
              </Field>
            </div>

            <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loadingAction !== ''}
                className="rounded-2xl border border-sky-300/40 bg-sky-100/80 px-5 py-4 font-black text-sky-700 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/60 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === 'send' ? 'Sending OTP...' : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>

              <button
                type="submit"
                disabled={loadingAction !== '' || !otpSent}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 px-5 py-4 font-black text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_45px_rgba(59,130,246,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === 'verify' ? 'Verifying...' : 'Create Doctor Account'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm text-slate-600">
              {doctorId
                ? `Doctor account created. Your permanent Doctor ID is ${doctorId}. We also emailed it to ${formData.email.trim().toLowerCase()}.`
                : otpSent
                ? `We sent a 4-digit OTP to ${formData.email.trim().toLowerCase() || 'your email'}.`
                : 'Complete your doctor details first, then request an OTP to finish sign-up.'}
            </div>

            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-sky-700">
              <ArrowLeft className="h-4 w-4" />
              Back to doctor login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, icon, children }) => (
  <div className="space-y-2">
    <label className="ml-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{label}</label>
    <div className="group relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">{icon}</div>
      {children}
    </div>
  </div>
);

export default DoctorSignUpPage;
