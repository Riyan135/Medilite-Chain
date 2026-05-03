import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  MessageSquare,
  Pill,
  PlayCircle,
  Search,
  Stethoscope,
  User,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import ConsultationCallModal from '../components/ConsultationCallModal';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { downloadPrescriptionPdf } from '../lib/prescription';

const emptyPrescription = { medicine: '', quantity: 1, dosage: '', duration: '', instructions: '' };

const statusTheme = {
  PENDING: 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/30',
  ONGOING: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/30',
  COMPLETED: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30',
};

const StatCard = ({ title, value, subtitle, icon: Icon, tone = 'blue' }) => {
  const tones = {
    blue: 'from-blue-50 to-blue-100 text-blue-600 dark:from-blue-500/10 dark:to-blue-600/10 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20',
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-600 dark:from-emerald-500/10 dark:to-emerald-600/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20',
    amber: 'from-amber-50 to-amber-100 text-amber-600 dark:from-amber-500/10 dark:to-amber-600/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',
    indigo: 'from-indigo-50 to-indigo-100 text-indigo-600 dark:from-indigo-500/10 dark:to-indigo-600/10 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20',
  };

  return (
    <div className="group relative rounded-[2rem] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1 p-6 overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tones[tone].split(' ').slice(0, 2).join(' ')} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-full -mr-16 -mt-16`} />
      <div className={`relative w-14 h-14 rounded-2xl border bg-gradient-to-br flex items-center justify-center ${tones[tone]} shadow-inner`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="relative mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      <h2 className="relative mt-2 text-4xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h2>
      <p className="relative mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{subtitle}</p>
    </div>
  );
};

const ConsultationEditor = ({ consultation, saving, onClose, onSave, onStart, onComplete }) => {
  const [form, setForm] = useState({
    symptoms: consultation?.symptoms || '',
    diagnosis: consultation?.diagnosis || '',
    notes: consultation?.notes || '',
    consultationType: consultation?.consultationType || 'ONLINE_CHAT',
    prescription: consultation?.prescription?.length ? consultation.prescription : [emptyPrescription],
  });

  useEffect(() => {
    setForm({
      symptoms: consultation?.symptoms || '',
      diagnosis: consultation?.diagnosis || '',
      notes: consultation?.notes || '',
      consultationType: consultation?.consultationType || 'ONLINE_CHAT',
      prescription: consultation?.prescription?.length ? consultation.prescription : [emptyPrescription],
    });
  }, [consultation]);

  if (!consultation) return null;

  const updatePrescriptionRow = (index, field, value) => {
    setForm((current) => ({
      ...current,
      prescription: current.prescription.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 opacity-100 transition-opacity duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 w-full max-w-5xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-200/50 dark:border-slate-800 p-8 max-h-[90vh] overflow-y-auto transform transition-transform duration-500 scale-100">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase mb-3">
              <Sparkles className="w-3 h-3" /> Consultation Room
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Clinical Editor</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {consultation.patient?.name} <span className="mx-2 text-slate-300 dark:text-slate-700">•</span> {consultation.scheduledDate} at {consultation.scheduledTime}
            </p>
          </div>
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <label className="space-y-2 group">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">Symptoms</span>
            <textarea
              value={form.symptoms}
              onChange={(event) => setForm((current) => ({ ...current, symptoms: event.target.value }))}
              rows="4"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-950/50 px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all resize-none"
            />
          </label>
          <label className="space-y-2 group">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">Diagnosis</span>
            <textarea
              value={form.diagnosis}
              onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))}
              rows="4"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-950/50 px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all resize-none"
            />
          </label>
          <label className="space-y-2 lg:col-span-2 group">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">Doctor's Private Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows="3"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-950/50 px-5 py-4 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all resize-none"
            />
          </label>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Prescription Builder</h3>
            </div>
            <button
              onClick={() =>
                setForm((current) => ({ ...current, prescription: [...current.prescription, emptyPrescription] }))
              }
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold transition-colors shadow-sm"
            >
              + Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {form.prescription.map((item, index) => (
              <div key={`${consultation.id}-${index}`} className="group grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/40 dark:bg-slate-800/20 p-3 hover:bg-white dark:hover:bg-slate-800/40 transition-colors shadow-sm hover:shadow-md">
                <input
                  value={item.medicine}
                  onChange={(event) => updatePrescriptionRow(index, 'medicine', event.target.value)}
                  placeholder="Medicine Name"
                  className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity || 1}
                  onChange={(event) => updatePrescriptionRow(index, 'quantity', event.target.value)}
                  placeholder="Qty"
                  className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                />
                <input
                  value={item.dosage}
                  onChange={(event) => updatePrescriptionRow(index, 'dosage', event.target.value)}
                  placeholder="Dosage (e.g. 1-0-1)"
                  className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                />
                <input
                  value={item.duration}
                  onChange={(event) => updatePrescriptionRow(index, 'duration', event.target.value)}
                  placeholder="Duration (e.g. 5 days)"
                  className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                />
                <input
                  value={item.instructions || ''}
                  onChange={(event) => updatePrescriptionRow(index, 'instructions', event.target.value)}
                  placeholder="Instructions (After food)"
                  className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => downloadPrescriptionPdf({ ...consultation, ...form })}
            className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-all shadow-sm"
          >
            Download PDF
          </button>
          {consultation.status === 'PENDING' && (
            <button
              onClick={() => onStart(consultation.id)}
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/30"
            >
              Start Session
            </button>
          )}
          <button
            onClick={() => onSave(consultation.id, form)}
            disabled={saving}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold transition-all shadow-lg"
          >
            Save Draft
          </button>
          <button
            onClick={() => onComplete(consultation.id, form)}
            disabled={saving}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-500/30"
          >
            Mark Completed
          </button>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [consultationStats, setConsultationStats] = useState({ total: 0, pending: 0, ongoing: 0, completed: 0 });
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const visiblePatients = searchResults.length ? searchResults : [];

  const consultationList = useMemo(
    () => consultations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [consultations]
  );

  useEffect(() => {
    let socket;

    if (user?.id) {
      socket = getSocket();
      socket.emit('join_room', { room: user.id });
      socket.on('incoming_appointment', (appointment) => {
        toast.success(`New appointment request from ${appointment.patient?.user?.name || 'a patient'}`, {
          icon: '📅',
          style: { borderRadius: '16px', background: '#333', color: '#fff' }
        });
        fetchPendingAppointments();
      });
      socket.on('consultation_created', (consultation) => {
        setConsultations((current) => [consultation, ...current]);
        toast.success(`New consultation created for ${consultation.patient?.name || 'a patient'}`);
      });
      socket.on('consultation_call_invite', (data) => {
        setIncomingCall({
          callId: data.callId,
          consultationId: data.consultationId,
          mode: data.mode,
          peerUserId: data.caller.id,
          peerUserName: data.caller.name,
          isInitiator: false,
        });
      });
      socket.on('consultation_call_accept', (data) => {
        setActiveCall((current) =>
          current || {
            callId: data.callId,
            consultationId: data.consultationId,
            mode: data.mode,
            peerUserId: data.acceptedBy.id,
            peerUserName: data.acceptedBy.name,
            isInitiator: true,
          }
        );
      });
      socket.on('consultation_call_end', (data) => {
        if (activeCall?.callId === data.callId) {
          setActiveCall(null);
          toast('Call ended', { icon: '📞' });
        }
      });

      fetchDashboardData();
    }

    return () => {
      socket?.off('incoming_appointment');
      socket?.off('consultation_created');
      socket?.off('consultation_call_invite');
      socket?.off('consultation_call_accept');
      socket?.off('consultation_call_end');
    };
  }, [user?.id, activeCall?.callId]);

  const fetchDashboardData = async () => {
    try {
      const [consultationRes, statsRes, appointmentsRes] = await Promise.all([
        api.get('/consultations'),
        api.get('/consultations/stats'),
        api.get('/appointments/pending'),
      ]);
      setConsultations(consultationRes.data);
      setConsultationStats(statsRes.data);
      setPendingAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching doctor dashboard data:', error);
      toast.error('Failed to load doctor dashboard');
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      const response = await api.get('/appointments/pending');
      setPendingAppointments(response.data);
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
    }
  };

  const handleSearch = async (event) => {
    if (event.key !== 'Enter' || !searchId.trim()) return;

    setLoadingSearch(true);
    try {
      const response = await api.get(`/doctors/search?query=${encodeURIComponent(searchId)}`);
      setSearchResults(response.data);
      if (!response.data.length) {
        toast.error('No patients found');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAppointmentStatus = async (appointment, status) => {
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { status });
      toast.success(status === 'ACCEPTED' ? 'Appointment accepted' : 'Appointment rejected');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment');
    }
  };

  const persistConsultation = async (consultationId, payload, nextStatus) => {
    setSavingConsultation(true);
    try {
      const response = await api.patch(`/consultations/${consultationId}`, {
        ...payload,
        status: nextStatus,
      });
      setConsultations((current) =>
        current.map((consultation) => (consultation.id === consultationId ? response.data : consultation))
      );
      setSelectedConsultation(response.data);
      const statsResponse = await api.get('/consultations/stats');
      setConsultationStats(statsResponse.data);
      toast.success('Consultation updated');
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast.error('Failed to update consultation');
    } finally {
      setSavingConsultation(false);
    }
  };

  const startConsultation = async (consultationId) => {
    await persistConsultation(consultationId, {}, 'ONGOING');
  };

  const saveConsultation = async (consultationId, payload) => {
    const existing = consultations.find((item) => item.id === consultationId);
    await persistConsultation(consultationId, payload, existing?.status || 'PENDING');
  };

  const completeConsultation = async (consultationId, payload) => {
    await persistConsultation(consultationId, payload, 'COMPLETED');
  };

  const openChat = (consultation) => {
    setActiveChat({
      otherUserId: consultation.patient?.id,
      otherUserName: consultation.patient?.name,
      consultationId: consultation.id,
    });
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    const socket = getSocket();
    socket.emit('consultation_call_accept', {
      callId: incomingCall.callId,
      consultationId: incomingCall.consultationId,
      targetUserId: incomingCall.peerUserId,
      mode: incomingCall.mode,
      acceptedBy: {
        id: user.id,
        name: `Dr. ${user.name}`,
      },
    });
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    const socket = getSocket();
    socket.emit('consultation_call_reject', {
      callId: incomingCall.callId,
      consultationId: incomingCall.consultationId,
      targetUserId: incomingCall.peerUserId,
      rejectedBy: {
        id: user.id,
        name: `Dr. ${user.name}`,
      },
    });
    setIncomingCall(null);
  };

  const closeCall = (notifyPeer = true) => {
    if (notifyPeer && activeCall) {
      const socket = getSocket();
      socket.emit('consultation_call_end', {
        callId: activeCall.callId,
        consultationId: activeCall.consultationId,
        targetUserId: activeCall.peerUserId,
      });
    }
    setActiveCall(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 z-10 custom-scrollbar">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-12">
          <div className="space-y-2 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-xs font-bold tracking-wide uppercase backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Active Session
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-xl">
              Welcome back, Dr. {user?.name?.split(' ')[0] || 'User'}. Here is your clinical summary for today.
            </p>
          </div>
          <div className="relative w-full xl:w-[26rem] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search patient records (Press Enter)"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              onKeyDown={handleSearch}
              className="w-full rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md pl-12 pr-4 py-4 font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-sm"
            />
            {loadingSearch && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Consultations" value={consultationStats.total} subtitle="All time record" icon={ClipboardList} />
          <StatCard title="Pending Review" value={consultationStats.pending} subtitle="Waiting to start" icon={Clock} tone="amber" />
          <StatCard title="Ongoing Cases" value={consultationStats.ongoing} subtitle="Live treatment" icon={PlayCircle} tone="blue" />
          <StatCard title="Completed" value={consultationStats.completed} subtitle="Ready for follow-up" icon={CheckCircle2} tone="emerald" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden flex flex-col transition-all">
              <div className="px-8 py-6 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Active Consultations
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {consultationList.length}
                    </span>
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage and execute your scheduled clinical sessions.</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {consultationList.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
                      <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No active consultations</h3>
                    <p className="text-slate-500 dark:text-slate-500 mt-2 max-w-sm">When you accept an appointment request, it will appear here as a consultation.</p>
                  </div>
                ) : (
                  consultationList.map((consultation) => (
                    <div key={consultation.id} className="group p-5 rounded-[1.5rem] bg-white dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{consultation.patient?.name || 'Unknown Patient'}</h3>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider ${statusTheme[consultation.status]}`}>
                            {consultation.status}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {consultation.consultationType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {consultation.scheduledDate || 'TBD'}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {consultation.scheduledTime || 'TBD'}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Notes:</span> {consultation.diagnosis || consultation.notes || consultation.symptoms || 'No initial diagnosis or notes recorded.'}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 shrink-0">
                        {consultation.status === 'PENDING' && (
                          <button
                            onClick={() => startConsultation(consultation.id)}
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
                          >
                            <PlayCircle className="w-4 h-4" /> Start
                          </button>
                        )}
                        <button
                          onClick={() => openChat(consultation)}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors tooltip-trigger"
                          title="Open Chat"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedConsultation(consultation)}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm transition-colors shadow-sm"
                        >
                          Editor
                        </button>
                        {consultation.prescription?.length > 0 && (
                          <button
                            onClick={() => downloadPrescriptionPdf(consultation)}
                            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="Download Prescription"
                          >
                            <Pill className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden flex flex-col transition-all">
              <div className="px-8 py-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Patient Directory</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Quickly access records from your search results.</p>
              </div>
              <div className="p-4 space-y-3">
                {visiblePatients.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-medium">
                    Search above to locate a patient profile.
                  </div>
                ) : (
                  visiblePatients.map((patient) => (
                    <div key={patient.id} className="group flex items-center justify-between gap-4 border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-950/50 rounded-2xl p-4 hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{patient.name}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{patient.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                        className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors shrink-0"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Booking Requests</h2>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Review incoming appointment requests.</p>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {pendingAppointments.length === 0 ? (
                  <div className="p-6 text-center text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    Your queue is clear.
                  </div>
                ) : (
                  pendingAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-[1.5rem] bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-black text-slate-900 dark:text-white truncate pr-2">{appointment.patient?.user?.name || 'Unknown Patient'}</p>
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase rounded-md tracking-wider shrink-0">New</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" /> {appointment.date} <span className="text-slate-300 dark:text-slate-600">|</span> {appointment.time}
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">"{appointment.reason || 'No reason provided.'}"</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAppointmentStatus(appointment, 'ACCEPTED')}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleAppointmentStatus(appointment, 'REJECTED')}
                          className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-sm transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] p-8 shadow-xl border border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 transition-transform duration-700 group-hover:scale-105"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="relative z-10 text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner mb-6">
                  <Stethoscope className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3">Telehealth Center</h3>
                <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6 opacity-90">
                  Conduct seamless virtual visits. All session logs and prescriptions are secured automatically.
                </p>
                <div className="space-y-3.5 text-sm font-medium text-white/90">
                  <div className="flex items-center gap-3 bg-black/10 p-2.5 rounded-xl border border-white/5"><Video className="w-4 h-4 text-blue-200" /> Secure Video & Audio calls</div>
                  <div className="flex items-center gap-3 bg-black/10 p-2.5 rounded-xl border border-white/5"><MessageSquare className="w-4 h-4 text-blue-200" /> Encrypted real-time chat</div>
                  <div className="flex items-center gap-3 bg-black/10 p-2.5 rounded-xl border border-white/5"><Pill className="w-4 h-4 text-blue-200" /> Digital PDF prescriptions</div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {selectedConsultation && (
        <ConsultationEditor
          consultation={selectedConsultation}
          saving={savingConsultation}
          onClose={() => setSelectedConsultation(null)}
          onSave={saveConsultation}
          onStart={startConsultation}
          onComplete={completeConsultation}
        />
      )}

      {incomingCall && (
        <div className="fixed top-6 right-6 z-[65] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl rounded-[2rem] p-6 w-full max-w-sm animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center animate-pulse">
              <PhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Incoming {incomingCall.mode} Call
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3 truncate">{incomingCall.peerUserName}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Patient is waiting to connect.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={acceptIncomingCall} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-md shadow-emerald-500/20">
              Accept
            </button>
            <button onClick={rejectIncomingCall} className="flex-1 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition-colors">
              Decline
            </button>
          </div>
        </div>
      )}

      {activeCall && (
        <ConsultationCallModal
          call={activeCall}
          socket={getSocket()}
          onClose={closeCall}
        />
      )}

      {activeChat && (
        <Chat
          otherUserId={activeChat.otherUserId}
          otherUserName={activeChat.otherUserName}
          consultationId={activeChat.consultationId}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;

