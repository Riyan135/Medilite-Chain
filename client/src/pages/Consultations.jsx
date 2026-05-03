import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ClipboardPlus,
  Download,
  MessageSquare,
  Plus,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { downloadPrescriptionPdf } from '../lib/prescription';

const statusTheme = {
  PENDING: 'bg-amber-100 text-amber-700',
  ONGOING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const emptyConsultationForm = {
  doctorId: '',
  symptoms: '',
  notes: '',
  consultationType: 'ONLINE_CHAT',
  scheduledDate: '',
  scheduledTime: '',
};

const CreateConsultationModal = ({ doctors, creating, onClose, onSubmit }) => {
  const [form, setForm] = useState(emptyConsultationForm);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Add Consultation</h2>
            <p className="text-slate-500 mt-2">Create a consultation request directly from the patient portal.</p>
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doctor</span>
            <select
              value={form.doctorId}
              onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-4"
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</span>
            <input
              type="date"
              value={form.scheduledDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(event) => setForm((current) => ({ ...current, scheduledDate: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-4"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Time</span>
            <input
              type="time"
              value={form.scheduledTime}
              onChange={(event) => setForm((current) => ({ ...current, scheduledTime: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-4"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Symptoms</span>
            <textarea
              rows="4"
              value={form.symptoms}
              onChange={(event) => setForm((current) => ({ ...current, symptoms: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-4"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes</span>
            <textarea
              rows="4"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-4"
            />
          </label>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => onSubmit(form)}
            disabled={creating}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-black"
          >
            {creating ? 'Creating...' : 'Create Consultation'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};



const Consultations = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, ongoing: 0, completed: 0 });
  const [doctors, setDoctors] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  const activeConsultations = useMemo(
    () => consultations.filter((consultation) => consultation.status !== 'COMPLETED'),
    [consultations]
  );
  const completedConsultations = useMemo(
    () => consultations.filter((consultation) => consultation.status === 'COMPLETED'),
    [consultations]
  );

  useEffect(() => {
    let socket;

    if (user?.id) {
      socket = getSocket();
      socket.emit('join_room', { room: user.id });

      const handleConsultationCreated = (consultation) => {
        setConsultations((current) => [consultation, ...current]);
        toast.success(`Consultation scheduled with Dr. ${consultation.doctor?.name || 'Doctor'}`);
        refreshStats();
      };

      socket.on('consultation_created', handleConsultationCreated);

      fetchData();
      fetchDoctors();

      return () => {
        socket.off('consultation_created', handleConsultationCreated);
      };
    }

    return undefined;
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [consultationRes, statsRes] = await Promise.all([
        api.get('/consultations'),
        api.get('/consultations/stats'),
      ]);
      setConsultations(consultationRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast.error('Failed to load consultations');
    }
  };

  const refreshStats = async () => {
    try {
      const response = await api.get('/consultations/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error refreshing consultation stats:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/auth/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleCreateConsultation = async (form) => {
    if (!form.doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/consultations', form);
      setConsultations((current) => [response.data, ...current]);
      setShowCreateModal(false);
      setCreating(false);
      refreshStats();
      toast.success('Consultation created');
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast.error('Failed to create consultation');
      setCreating(false);
    }
  };


  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Consultations</h1>
            <p className="text-slate-500 mt-2">Manage consultations, connect with your doctor, and join live calls.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-600/25"
          >
            <Plus className="w-5 h-5" />
            Add Consultation
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <ClipboardPlus className="w-10 h-10 text-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Total</p>
            <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{stats.total}</h2>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <Calendar className="w-10 h-10 text-amber-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Pending</p>
            <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{stats.pending}</h2>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <Video className="w-10 h-10 text-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Ongoing</p>
            <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{stats.ongoing}</h2>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Completed</p>
            <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{stats.completed}</h2>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900">Active Consultations</h2>
                <p className="text-sm text-slate-500 mt-1">Join chat, start calls, and track the current care plan.</p>
              </div>
              <div className="p-6 space-y-4">
                {activeConsultations.length === 0 ? (
                  <div className="text-slate-400">No active consultations yet.</div>
                ) : (
                  activeConsultations.map((consultation) => (
                    <div key={consultation.id} className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-black text-slate-900">Dr. {consultation.doctor?.name || 'Doctor'}</h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusTheme[consultation.status]}`}>
                              {consultation.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-2">
                            {consultation.scheduledDate || 'TBD'} | {consultation.scheduledTime || 'TBD'} | {consultation.consultationType.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-slate-600 mt-3">
                            {consultation.diagnosis || consultation.notes || consultation.symptoms || 'Waiting for doctor notes.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              setActiveChat({
                                id: consultation.doctor?.id,
                                name: `Dr. ${consultation.doctor?.name || 'Doctor'}`,
                                consultationId: consultation.id,
                              })
                            }
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900">Consultation History</h2>
                <p className="text-sm text-slate-500 mt-1">View completed consultations and download prescriptions.</p>
              </div>
              <div className="p-6 space-y-4">
                {completedConsultations.length === 0 ? (
                  <div className="text-slate-400">Completed consultations will appear here.</div>
                ) : (
                  completedConsultations.map((consultation) => (
                    <div key={consultation.id} className="rounded-[1.75rem] border border-slate-100 bg-white p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-900">Dr. {consultation.doctor?.name || 'Doctor'}</h3>
                          <p className="text-sm text-slate-500 mt-2">
                            {consultation.scheduledDate || 'TBD'} | {consultation.scheduledTime || 'TBD'}
                          </p>
                          <p className="text-sm text-slate-600 mt-3">
                            Diagnosis: {consultation.diagnosis || 'Not added yet'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              setActiveChat({
                                id: consultation.doctor?.id,
                                name: `Dr. ${consultation.doctor?.name || 'Doctor'}`,
                                consultationId: consultation.id,
                              })
                            }
                            className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold"
                          >
                            Follow Up
                          </button>
                          {consultation.prescription?.length > 0 && (
                            <button
                              onClick={() => downloadPrescriptionPdf(consultation)}
                              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold"
                            >
                              <Download className="w-4 h-4" />
                              Download PDF
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] p-6 shadow-xl">
              <h3 className="text-2xl font-black">Live Consultation Tools</h3>
              <p className="mt-3 text-blue-100 text-sm leading-6">
                Your doctor can start a voice or video consultation and you can answer it here in real time.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4" /> Doctors start calls from their dashboard or patient profile.</div>
                <div className="flex items-center gap-3"><ClipboardPlus className="w-4 h-4" /> You can answer voice and video calls from this page.</div>
                <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /> Chat stays linked to the consultation record.</div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {showCreateModal && (
        <CreateConsultationModal
          doctors={doctors}
          creating={creating}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateConsultation}
        />
      )}



      {activeChat && (
        <Chat
          otherUserId={activeChat.id}
          otherUserName={activeChat.name}
          consultationId={activeChat.consultationId}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

export default Consultations;
