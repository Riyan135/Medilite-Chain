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
  PENDING: 'bg-amber-100 text-amber-700',
  ONGOING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const StatCard = ({ title, value, subtitle, icon: Icon, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm p-6">
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{value}</h2>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">{subtitle}</p>
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl border border-slate-100 p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Consultation Editor</h2>
            <p className="text-slate-500 mt-2">
              {consultation.patient?.name} | {consultation.scheduledDate} at {consultation.scheduledTime}
            </p>
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Symptoms</span>
            <textarea
              value={form.symptoms}
              onChange={(event) => setForm((current) => ({ ...current, symptoms: event.target.value }))}
              rows="5"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis</span>
            <textarea
              value={form.diagnosis}
              onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))}
              rows="5"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doctor Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows="5"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            />
          </label>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-900">Prescription</h3>
            <button
              onClick={() =>
                setForm((current) => ({ ...current, prescription: [...current.prescription, emptyPrescription] }))
              }
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold"
            >
              Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {form.prescription.map((item, index) => (
              <div key={`${consultation.id}-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <input
                  value={item.medicine}
                  onChange={(event) => updatePrescriptionRow(index, 'medicine', event.target.value)}
                  placeholder="Medicine"
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity || 1}
                  onChange={(event) => updatePrescriptionRow(index, 'quantity', event.target.value)}
                  placeholder="Qty"
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />
                <input
                  value={item.dosage}
                  onChange={(event) => updatePrescriptionRow(index, 'dosage', event.target.value)}
                  placeholder="Dosage"
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />
                <input
                  value={item.duration}
                  onChange={(event) => updatePrescriptionRow(index, 'duration', event.target.value)}
                  placeholder="Duration"
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />
                <input
                  value={item.instructions || ''}
                  onChange={(event) => updatePrescriptionRow(index, 'instructions', event.target.value)}
                  placeholder="Instructions"
                  className="rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {consultation.status === 'PENDING' && (
            <button
              onClick={() => onStart(consultation.id)}
              disabled={saving}
              className="px-5 py-3 rounded-2xl bg-[#1d4ed8] text-white font-black hover:brightness-110 transition-all"
            >
              Start Consultation
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(consultation.id, form)}
            disabled={saving}
            className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all"
          >
            Save Updates
          </button>
          <button
            onClick={() => onComplete(consultation.id, form)}
            disabled={saving}
            className="px-5 py-3 rounded-2xl bg-[#16a34a] text-white font-black hover:brightness-110 transition-all"
          >
            Mark Completed
          </button>
          <button
            onClick={() => downloadPrescriptionPdf({ ...consultation, ...form })}
            className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black"
          >
            Download Prescription
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
        toast.success(`New appointment request from ${appointment.patient?.user?.name || 'a patient'}`);
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
          toast('Call ended');
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
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Doctor Dashboard</h1>
            <p className="text-slate-500 mt-2">Manage upcoming consultations, prescriptions, and patient chats.</p>
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient by name or email"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              onKeyDown={handleSearch}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4"
            />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Consultations" value={consultationStats.total} subtitle="All linked consultations" icon={ClipboardList} />
          <StatCard title="Pending" value={consultationStats.pending} subtitle="Waiting to start" icon={Clock} tone="amber" />
          <StatCard title="Ongoing" value={consultationStats.ongoing} subtitle="Live treatment sessions" icon={PlayCircle} tone="blue" />
          <StatCard title="Completed" value={consultationStats.completed} subtitle="Ready for follow-up" icon={CheckCircle2} tone="emerald" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Upcoming Consultations</h2>
                  <p className="text-sm text-slate-500 mt-1">Start, update, and complete confirmed appointments.</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {consultationList.length} total
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {consultationList.length === 0 ? (
                  <div className="p-8 text-slate-400">No consultations created yet. Accept an appointment to create one.</div>
                ) : (
                  consultationList.map((consultation) => (
                    <div key={consultation.id} className="p-6 flex flex-col lg:flex-row lg:items-center gap-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900">{consultation.patient?.name || 'Patient'}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusTheme[consultation.status]}`}>
                            {consultation.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            {consultation.consultationType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                          {consultation.scheduledDate || 'No date'} at {consultation.scheduledTime || 'No time'}
                        </p>
                        <p className="text-sm text-slate-600 mt-3">
                          {consultation.diagnosis || consultation.notes || consultation.symptoms || 'No diagnosis or notes added yet.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {consultation.status === 'PENDING' && (
                          <button
                            onClick={() => startConsultation(consultation.id)}
                            className="px-4 py-3 rounded-2xl bg-blue-600 text-white font-bold"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => openChat(consultation)}
                          className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => setSelectedConsultation(consultation)}
                          className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold"
                        >
                          Update
                        </button>
                        {consultation.prescription?.length > 0 && (
                          <button
                            onClick={() => downloadPrescriptionPdf(consultation)}
                            className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold"
                          >
                            Prescription
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Patient Search</h2>
                  <p className="text-sm text-slate-500 mt-1">Open patient records or jump into a consultation chat.</p>
                </div>
                {loadingSearch && <span className="text-sm text-slate-400">Searching...</span>}
              </div>
              <div className="p-6 space-y-4">
                {visiblePatients.length === 0 ? (
                  <div className="text-slate-400">Search for a patient by pressing Enter in the search box above.</div>
                ) : (
                  visiblePatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between gap-4 border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{patient.name}</p>
                          <p className="text-sm text-slate-500">{patient.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                        className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-600 font-bold"
                      >
                        Open Record
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900">Appointment Queue</h2>
                <p className="text-sm text-slate-500 mt-1">Accept confirmed bookings and generate consultations.</p>
              </div>
              <div className="p-6 space-y-4">
                {pendingAppointments.length === 0 ? (
                  <div className="text-slate-400">No pending appointment requests right now.</div>
                ) : (
                  pendingAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-2xl border border-slate-100 p-4">
                      <p className="font-bold text-slate-900">{appointment.patient?.user?.name || 'Patient'}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {appointment.date} | {appointment.time}
                      </p>
                      <p className="text-sm text-slate-600 mt-3">{appointment.reason || 'No symptoms added yet.'}</p>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleAppointmentStatus(appointment, 'ACCEPTED')}
                          className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleAppointmentStatus(appointment, 'REJECTED')}
                          className="flex-1 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem] p-6 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="mt-5 text-2xl font-black">Online Consultation</h3>
              <p className="mt-3 text-blue-100 text-sm leading-6">
                Start a consultation to open the live chat with your patient. Video support can be layered on top of this consultation room later.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4" /> Confirmed appointments create consultations automatically.</div>
                <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /> Chat stays attached to the consultation record.</div>
                <div className="flex items-center gap-3"><Pill className="w-4 h-4" /> Prescriptions can be downloaded as printable PDFs.</div>
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
        <div className="fixed top-6 right-6 z-[65] bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 w-full max-w-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Incoming {incomingCall.mode === 'video' ? 'video' : 'voice'} consultation call
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{incomingCall.peerUserName}</h3>
          <div className="mt-5 flex gap-3">
            <button onClick={acceptIncomingCall} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold">
              Accept
            </button>
            <button onClick={rejectIncomingCall} className="flex-1 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold">
              Reject
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
