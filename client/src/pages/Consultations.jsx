import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ClipboardPlus,
  Download,
  MapPin,
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

const consultationTypes = [
  { id: 'ONLINE_CHAT', label: 'Chat', icon: MessageSquare },
  { id: 'VIDEO_CALL', label: 'Video Call', icon: Video },
  { id: 'IN_PERSON', label: 'Clinic Visit', icon: MapPin },
];

const CreateConsultationModal = ({ doctors, creating, onClose, onSubmit }) => {
  const [form, setForm] = useState(emptyConsultationForm);
  const selectedDoctor = doctors.find((doctor) => doctor.id === form.doctorId);

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
                  Dr. {doctor.name}{doctor.specialization ? ` - ${doctor.specialization}` : ' - General Physician'}
                </option>
              ))}
            </select>
            {selectedDoctor && (
              <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-slate-900">Dr. {selectedDoctor.name}</p>
                  <p className="text-xs font-bold text-blue-600">{selectedDoctor.specialization || 'General Physician'}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 shadow-sm">
                  Selected
                </span>
              </div>
            )}
          </label>

          <div className="space-y-2 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultation Type</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {consultationTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = form.consultationType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, consultationType: type.id }))}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-black transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

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
      socket.on('prescription_ready', fetchData);

      fetchData();
      fetchDoctors();

      return () => {
        socket.off('consultation_created', handleConsultationCreated);
        socket.off('prescription_ready', fetchData);
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

  const handleDownloadPrescription = async (consultation) => {
    try {
      await downloadPrescriptionPdf(consultation);
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast.error('Unable to download prescription PDF');
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
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] shadow-xl shadow-blue-600/20 p-6 text-white relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <ClipboardPlus className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <ClipboardPlus className="w-6 h-6 text-white" />
              </div>
              <p className="mt-6 text-blue-100 font-medium tracking-wide">Total Consultations</p>
              <h2 className="mt-1 text-5xl font-black">{stats.total}</h2>
            </div>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-amber-600">
              <Calendar className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <p className="mt-6 text-slate-500 font-medium tracking-wide">Pending</p>
              <h2 className="mt-1 text-5xl font-black text-slate-900">{stats.pending}</h2>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-indigo-600">
              <Video className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Video className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="mt-6 text-slate-500 font-medium tracking-wide">Ongoing</p>
              <h2 className="mt-1 text-5xl font-black text-slate-900">{stats.ongoing}</h2>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-emerald-600">
              <CheckCircle2 className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="mt-6 text-slate-500 font-medium tracking-wide">Completed</p>
              <h2 className="mt-1 text-5xl font-black text-slate-900">{stats.completed}</h2>
            </div>
          </div>
        </section>

        <div className="w-full">
          <div className="w-full space-y-10">
            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900">Active Consultations</h2>
                <p className="text-sm text-slate-500 mt-1">Join chat, start calls, and track the current care plan.</p>
              </div>
              <div className="p-6 space-y-4">
                {activeConsultations.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-blue-600 shadow-lg shadow-blue-100">
                      <ClipboardPlus className="h-8 w-8" />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-900">No active consultations yet</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                      New chat, call, and clinic requests will appear here once a consultation is created.
                    </p>
                  </div>
                ) : (
                  activeConsultations.map((consultation) => (
                    <div key={consultation.id} className="rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/30 p-1 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300">
                      <div className="bg-slate-50/50 rounded-[1.75rem] p-6 h-full flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-start gap-6">
                          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 items-center justify-center shadow-inner flex-shrink-0">
                            <span className="text-xl font-black text-blue-700">{consultation.doctor?.name?.charAt(0) || 'D'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-2xl font-black text-slate-900">Dr. {consultation.doctor?.name || 'Doctor'}</h3>
                              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${statusTheme[consultation.status]}`}>
                                {consultation.status === 'ONGOING' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                                {consultation.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-3 font-medium">
                              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">
                                <Calendar className="w-4 h-4 text-slate-400" /> {consultation.scheduledDate || 'TBD'}
                              </span>
                              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">
                                <ClipboardPlus className="w-4 h-4 text-slate-400" /> {consultation.consultationType.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="mt-4 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-sm text-slate-600 font-medium">
                                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Reason for visit</span>
                                {consultation.diagnosis || consultation.notes || consultation.symptoms || 'Waiting for doctor notes.'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[140px]">
                          {consultation.prescription?.length > 0 && (
                            <button
                              onClick={() => handleDownloadPrescription(consultation)}
                              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black transition-colors"
                            >
                              <Download className="w-5 h-5" />
                              Prescription
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setActiveChat({
                                id: consultation.doctor?.id,
                                name: `Dr. ${consultation.doctor?.name || 'Doctor'}`,
                                consultationId: consultation.id,
                              })
                            }
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-600/25 transition-colors"
                          >
                            <MessageSquare className="w-5 h-5" />
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
                  <div className="rounded-[2rem] border border-dashed border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-emerald-600 shadow-lg shadow-emerald-100">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-900">No completed visits yet</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                      Completed consultations and downloadable prescriptions will collect here.
                    </p>
                  </div>
                ) : (
                  completedConsultations.map((consultation) => (
                    <div key={consultation.id} className="rounded-[2rem] border border-slate-100 bg-white shadow-lg shadow-slate-200/20 p-5 hover:shadow-xl transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100 flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900">Dr. {consultation.doctor?.name || 'Doctor'}</h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 font-medium">
                              <span>{consultation.scheduledDate || 'TBD'}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span>{consultation.scheduledTime || 'TBD'}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-3 bg-slate-50 px-4 py-2 rounded-xl inline-block">
                              <span className="font-bold text-slate-700">Diagnosis:</span> {consultation.diagnosis || 'Not added yet'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() =>
                              setActiveChat({
                                id: consultation.doctor?.id,
                                name: `Dr. ${consultation.doctor?.name || 'Doctor'}`,
                                consultationId: consultation.id,
                              })
                            }
                            className="px-5 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                          >
                            Follow Up
                          </button>
                          {consultation.prescription?.length > 0 && (
                            <button
                              onClick={() => handleDownloadPrescription(consultation)}
                              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors"
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
