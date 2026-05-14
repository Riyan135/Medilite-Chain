import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, AlertTriangle, BrainCircuit, CheckCircle2, Info, Mic, 
  ShieldAlert, Sparkles, Stethoscope, Thermometer, X, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const SymptomChecker = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setTodayDate(new Date().toLocaleDateString(undefined, options));
  }, []);

  const checkSymptoms = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const response = await api.post('/symptoms/analyze', { symptoms, language: 'English' });
      setResult(response.data);
      toast.success('Analysis complete');
    } catch (error) {
      toast.error('Failed to analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'URGENT': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'MODERATE': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans selection:bg-blue-600/20 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
        <header className="mb-12 flex flex-wrap items-start justify-between gap-8 rounded-[2.25rem] border border-white/60 bg-white/70 p-10 backdrop-blur-2xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black tracking-[0.4em] uppercase border border-blue-100 mb-4">
              <Sparkles className="h-3 w-3" />
              Guided Symptom Scan
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">AI Symptom Checker</h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Describe how you feel, use voice input if you want, and get a fast first-pass health insight with clearer guidance.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-xl shadow-slate-200/50 min-w-[320px]">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Health Log Session</p>
             <p className="text-2xl font-black text-slate-900 tracking-tight">{todayDate}</p>
             <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Patient: {user?.name}</p>
             </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { icon: Thermometer, title: "Smart Triage", body: "Turn your symptom notes into a clearer risk and care suggestion.", color: "blue" },
            { icon: Mic, title: "Voice Friendly", body: "Speak your symptoms directly if typing feels slow or difficult.", color: "indigo" },
            { icon: Stethoscope, title: "Doctor Guidance", body: "See whether home care, consultation, or urgent action is suggested.", color: "emerald" }
          ].map((card) => (
            <div key={card.title} className="group rounded-[2rem] border border-white/60 bg-white/75 p-10 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:bg-white backdrop-blur-xl">
              <div className={`w-16 h-16 rounded-2xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600 mb-8 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                <card.icon size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{card.title}</h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-wide">{card.body}</p>
            </div>
          ))}
        </section>

        <section className="bg-white/70 rounded-[3rem] border border-white/60 shadow-sm overflow-hidden mb-12 backdrop-blur-2xl">
          <div className="p-10 lg:p-14">
             <div className="mb-10">
                <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Symptom Input</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tell us what you're feeling</h2>
             </div>

             <form onSubmit={checkSymptoms} className="space-y-8">
                <div className="relative group">
                   <textarea
                     value={symptoms}
                     onChange={(e) => setSymptoms(e.target.value)}
                     placeholder="Example: I have fever, body pain, headache, and a dry cough since morning..."
                     className="w-full min-h-[280px] p-10 rounded-[2.5rem] bg-slate-50/50 border-2 border-slate-100 text-slate-900 font-bold outline-none focus:ring-8 focus:ring-blue-600/5 focus:border-blue-500 transition-all text-lg resize-none placeholder:text-slate-300"
                   />
                   <div className="absolute top-10 right-10">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm animate-pulse">
                         <Activity size={24} />
                      </div>
                   </div>
                   <div className="absolute bottom-10 right-10 flex gap-4">
                      <button type="button" className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-lg hover:shadow-blue-500/25">
                         <Mic size={24} />
                      </button>
                      <button type="button" onClick={() => {setSymptoms(''); setResult(null);}} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white text-slate-400 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-lg">
                         <X size={24} />
                      </button>
                   </div>
                </div>

                <div className="flex items-center gap-4 p-6 rounded-3xl bg-blue-50/50 text-blue-800 text-[11px] font-black uppercase tracking-[0.05em] border border-blue-100/50 leading-relaxed">
                   <Info className="w-5 h-5 shrink-0" />
                   Add as much detail as you can. Better descriptions usually produce a more helpful first-pass result. This tool is not for emergency diagnosis.
                </div>

                <button
                  type="submit"
                  disabled={!symptoms.trim() || loading}
                  className="w-full py-6 rounded-[1.5rem] bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 hover:shadow-blue-600/40 disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? 'Analyzing Protocol...' : 'Analyze Symptoms'}
                </button>
             </form>

             <AnimatePresence>
               {result && (
                 <motion.div 
                   initial={{ opacity: 0, y: 40 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="mt-16 pt-16 border-t border-slate-100"
                 >
                   <div className="flex flex-col lg:flex-row gap-10">
                      <div className="flex-1">
                         <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Clinical Insight</p>
                         <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-8">Analysis Summary</h3>
                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                            <p className="text-lg font-bold text-slate-600 leading-relaxed">
                              {result.analysis}
                            </p>
                         </div>
                      </div>

                      <div className="lg:w-[400px] space-y-6">
                         <div className={`p-8 rounded-[2rem] border-2 ${getUrgencyColor(result.urgency)}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">Urgency Protocol</p>
                            <div className="flex items-center gap-3">
                               <AlertTriangle className="w-6 h-6" />
                               <span className="text-2xl font-black tracking-tight">{result.urgency}</span>
                            </div>
                         </div>

                         <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] text-indigo-900">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-indigo-400">Suggested Action</p>
                            <p className="text-xl font-black leading-tight mb-6">{result.suggestedAction}</p>
                            <button 
                              onClick={() => navigate('/book-appointment')}
                              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                            >
                               Book Consultation
                            </button>
                         </div>
                      </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SymptomChecker;
