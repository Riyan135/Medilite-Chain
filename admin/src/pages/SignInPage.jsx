import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, KeyRound, Mail, MailCheck, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const DOCTOR_STORAGE_KEY = 'medilite_doctor_user';

const SignInPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [doctorId, setDoctorId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailPreview, setEmailPreview] = useState('');
  const [loadingAction, setLoadingAction] = useState('');

  useEffect(() => {
    const storedDoctor = localStorage.getItem(DOCTOR_STORAGE_KEY) || localStorage.getItem('medilite_user');

    if (!storedDoctor) return;

    try {
      const parsedDoctor = JSON.parse(storedDoctor);
      if (parsedDoctor?.role === 'DOCTOR' && parsedDoctor?.doctorId) {
        setDoctorId(parsedDoctor.doctorId);
        setName(parsedDoctor.name || '');
        setEmail(parsedDoctor.email || '');
      }
    } catch (error) {
      console.error('Failed to prefill Doctor ID:', error);
    }
  }, []);

  const normalizedDoctorId = useMemo(() => doctorId.trim().toUpperCase(), [doctorId]);
  const normalizedName = useMemo(() => name.trim(), [name]);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleSendOtp = async (event) => {
    event.preventDefault();

    if (!normalizedDoctorId || !normalizedName || !normalizedEmail) {
      toast.error('Enter your Doctor ID, doctor name, and email first');
      return;
    }

    setLoadingAction('send');
    try {
      const response = await api.post('/auth/doctor/request-otp', {
        doctorId: normalizedDoctorId,
        name: normalizedName,
        email: normalizedEmail,
      });
      setOtpSent(true);
      setEmailPreview(response.data.emailPreview || '');
      toast.success(`OTP sent for ${normalizedDoctorId}`);
    } catch (error) {
      const responseError = error.response?.data;

      if (responseError?.signupRequired) {
        toast('Doctor ID not found. Please create your doctor account.');
        navigate('/sign-up');
        return;
      }

      toast.error(responseError?.error || 'Failed to send OTP');
    } finally {
      setLoadingAction('');
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!normalizedDoctorId || !otp.trim()) {
      toast.error('Enter your Doctor ID and OTP');
      return;
    }

    setLoadingAction('verify');
    try {
      const response = await api.post('/auth/doctor/verify-otp', {
        doctorId: normalizedDoctorId,
        otp: otp.trim(),
      });

      const { user, token } = response.data;

      login({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        token,
        doctorId: user.doctorId,
        specialization: user.specialization,
      });

      toast.success(`Welcome back, Dr. ${user.name}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#e0f2fe_24%,#dbeafe_50%,#ede9fe_76%,#fef3c7_100%)]" />
      <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_center,rgba(255,255,255,0.72),transparent_58%)]" />
      <div className="absolute -top-20 left-[6%] h-80 w-80 rounded-full bg-cyan-300/30 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-8rem] right-[4%] h-[28rem] w-[28rem] rounded-full bg-violet-300/25 blur-[150px] animate-[pulse_10s_ease-in-out_infinite]" />
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
        <div className="grid w-full max-w-6xl lg:grid-cols-[1.08fr_0.92fr] gap-10 items-center">
          <div className="hidden lg:block space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/55 px-5 py-2 text-sm font-semibold text-sky-700 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.4)]">
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              Doctor ID + OTP secure login
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl xl:text-6xl font-black leading-tight tracking-tight">
                Doctor access with a
                <span className="block bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                  permanent Doctor ID
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-600 leading-relaxed">
                Use your permanent Doctor ID to request an OTP. If the ID exists, we send the OTP to your registered
                email and take you straight to the dashboard after verification.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard title="Permanent ID" description="Your Doctor ID stays fixed for future logins and is remembered on this device when available." />
              <InfoCard title="OTP Verified" description="Only the OTP sent to your registered email can complete doctor access." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/68 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(59,130,246,0.18)] transition-all duration-700 hover:-translate-y-1 hover:shadow-[0_36px_100px_rgba(99,102,241,0.2)]">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/80 bg-gradient-to-br from-sky-100 to-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Stethoscope className="h-10 w-10 text-sky-600" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">Doctor Login</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Enter your Doctor ID, doctor name, and email, request an OTP, and continue to the doctor portal.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Doctor ID</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <BadgeCheck className="h-5 w-5 text-sky-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={doctorId}
                    onChange={(event) => setDoctorId(event.target.value.toUpperCase())}
                    className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                    placeholder="DOC-123456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Doctor Name</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <UserRound className="h-5 w-5 text-sky-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                    placeholder="Enter doctor name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Email Address</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-sky-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-sky-400/70 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
                    placeholder="doctor@medilite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">One-Time Password</label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <KeyRound className="h-5 w-5 text-violet-500" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full rounded-2xl border border-white/80 bg-white/75 py-4 pl-11 pr-4 font-semibold tracking-[0.35em] text-slate-800 placeholder:tracking-normal placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-400/70 focus:bg-white focus:ring-4 focus:ring-violet-400/10"
                    placeholder="Enter OTP"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
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
                  {loadingAction === 'verify' ? 'Verifying...' : 'Go To Dashboard'}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm text-slate-600">
                {otpSent
                  ? `We sent a 4-digit OTP to ${emailPreview || 'your registered email'}.`
                  : 'Enter your Doctor ID, doctor name, and doctor email. If they match our records, we will send the OTP.'}
              </div>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-black text-slate-900">New doctor?</p>
                <p className="mt-1 text-sm text-slate-500">Create your doctor account, get a permanent Doctor ID, and keep it for future logins.</p>
              </div>
              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <MailCheck className="h-4 w-4" />
                Sign Up
              </Link>
            </div>
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
