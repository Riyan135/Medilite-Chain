import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Info,
  Mic,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Thermometer,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const SymptomChecker = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setTodayDate(new Date().toLocaleDateString(undefined, options));
  }, []);

  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice input is not supported on this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setSymptoms((prev) => (prev ? `${prev} ${text}` : text));
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleClear = () => {
    setSymptoms('');
    setResult(null);
  };

  const checkSymptoms = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/symptoms/analyze', {
        symptoms,
        language: 'English',
      });

      setResult(res.data);
      toast.success('Analysis complete');
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (l === 'medium') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden symptom-page-shell selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-12%] right-[-6%] w-[38rem] h-[38rem] rounded-full bg-gradient-to-bl from-blue-400/18 via-indigo-300/12 to-transparent blur-[120px] animate-float" />
        <div className="absolute bottom-[-18%] left-[-8%] w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-cyan-300/16 via-sky-300/12 to-transparent blur-[120px] animate-[drift_18s_ease-in-out_infinite]" />
        <div className="absolute top-[14%] left-[12%] size-20 rounded-full border border-white/40 bg-white/20 animate-[soft-spin_22s_linear_infinite]" />
        <div className="absolute bottom-[22%] right-[16%] size-10 rounded-full bg-white/60 shadow-[0_0_34px_rgba(255,255,255,0.85)] animate-[bob_7s_ease-in-out_infinite]" />
      </div>

      <Sidebar role="patient" />

      <main className="flex-1 p-8 overflow-y-auto relative z-10">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur-xl animate-slide-up-fade">
              <Sparkles className="h-4 w-4" />
              Guided Symptom Scan
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-black tracking-tight text-slate-900">AI Symptom Checker</h1>
            <p className="mt-3 max-w-2xl text-lg font-medium text-slate-500">
              Describe how you feel, use voice input if you want, and get a fast first-pass health insight with clearer guidance.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl symptom-panel-lift">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Today</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{todayDate || 'Loading date...'}</p>
            <p className="mt-2 text-sm text-slate-500">Patient: {user?.name || 'Portal User'}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <QuickCard
            icon={Thermometer}
            title="Smart Triage"
            body="Turn your symptom notes into a clearer risk and care suggestion."
            tone="blue"
          />
          <QuickCard
            icon={Mic}
            title="Voice Friendly"
            body="Speak your symptoms directly if typing feels slow or difficult."
            tone="indigo"
          />
          <QuickCard
            icon={Stethoscope}
            title="Doctor Guidance"
            body="See whether home care, consultation, or urgent action is suggested."
            tone="emerald"
          />
        </section>

        <section className="grid grid-cols-1 gap-8">
          <div className="rounded-[2rem] border border-white/70 bg-white/72 p-6 md:p-8 shadow-xl shadow-slate-200/40 backdrop-blur-xl animate-slide-up-fade symptom-panel-lift">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Describe Symptoms</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Tell us what you’re feeling</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                <Activity className="h-6 w-6" />
              </div>
            </div>

            <form onSubmit={checkSymptoms}>
              <div className="relative">
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Example: I have fever, body pain, headache, and a dry cough since morning..."
                  className="w-full min-h-44 resize-none rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-5 py-5 pr-30 text-slate-800 shadow-inner outline-none transition-all duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={handleVoiceCommand}
                  className={`absolute right-16 bottom-4 flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${
                    isListening
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  <Mic size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-700">
                <Info className="h-4 w-4 shrink-0" />
                Add as much detail as you can. Better descriptions usually produce a more helpful first-pass result.
              </div>

              <button
                type="submit"
                disabled={!symptoms || loading}
                className="mt-6 w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-base shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-2xl disabled:opacity-60 disabled:hover:translate-y-0 landing-button-sheen"
              >
                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
              </button>
            </form>
          </div>
        </section>

        {result && !loading && (
          <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/78 p-6 md:p-8 shadow-2xl shadow-slate-200/45 backdrop-blur-xl animate-slide-up-fade symptom-panel-lift">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Analysis Result</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">{result.predicted_disease}</h2>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${getRiskColor(result.risk_level)}`}>
                <ShieldAlert className="h-4 w-4" />
                Risk: {result.risk_level}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <ResultCard label="Doctor Suggestion" value={result.doctor_suggestion} icon={Stethoscope} />
              <ResultCard label="Care Type" value={result.care_type} icon={CheckCircle2} />
              <ResultCard label="Precautions" value={result.precautions} icon={ShieldAlert} />
              <ResultCard label="Advice" value={result.advice} icon={BrainCircuit} />
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-900 flex gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{result.disclaimer}</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const QuickCard = ({ icon: Icon, title, body, tone }) => {
  const tones = {
    blue: 'from-blue-500/14 to-sky-400/10 text-blue-600',
    indigo: 'from-indigo-500/14 to-violet-400/10 text-indigo-600',
    emerald: 'from-emerald-500/14 to-cyan-400/10 text-emerald-600',
  };

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/72 backdrop-blur-xl p-6 shadow-xl shadow-slate-200/35 transition-all duration-500 hover:-translate-y-1.5 symptom-panel-lift">
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} shadow-sm`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-500">{body}</p>
    </div>
  );
};

const ResultCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50/85 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white">
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
    </div>
    <p className="mt-4 text-sm leading-7 font-medium text-slate-700">{value}</p>
  </div>
);

export default SymptomChecker;
