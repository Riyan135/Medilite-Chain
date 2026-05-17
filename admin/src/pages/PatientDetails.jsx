import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { User, Calendar, FileText, Plus, ArrowLeft, Pill, Activity, ShieldCheck, MessageSquare, BrainCircuit, X, AlertCircle, ExternalLink, Phone, Video } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Chat from '../components/Chat';
import { getSocket } from '../lib/socket';
import ConsultationCallModal from '../components/ConsultationCallModal';

const PatientDetails = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('view') === 'consultation' ? 'consultation' : 'dashboard';
  const { user: doctorUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('Consultation Note');
  const [submitting, setSubmitting] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [summarizingId, setSummarizingId] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeSummary, setActiveSummary] = useState(null);
  const [generatingOverview, setGeneratingOverview] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [healthOverview, setHealthOverview] = useState(null);
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    consultationId: '',
    diagnosis: '',
    notes: '',
    medicines: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
  });
  const [savingPrescription, setSavingPrescription] = useState(false);

  useEffect(() => {
    if (patient?.patientProfile?.id) {
      api.get(`/symptoms/patient/${patient.patientProfile.id}`)
        .then(res => setSymptomHistory(res.data))
        .catch(err => console.error('Error fetching symptom history:', err));
    }
  }, [patient?.patientProfile?.id]);

  const handleGenerateOverview = async () => {
    if (!patient?.patientProfile?.records || patient.patientProfile.records.length === 0) {
      toast.error('No records available to summarize.');
      return;
    }
    setGeneratingOverview(true);
    try {
      const response = await api.post(`/doctors/patient/${patientId}/health-overview`, { language: 'English' });
      setHealthOverview(response.data);
      setShowOverviewModal(true);
      toast.success('Holistic health analysis complete!');
    } catch (error) {
      console.error('Error generating health overview:', error);
      toast.error('Failed to generate health overview.');
    } finally {
      setGeneratingOverview(false);
    }
  };

  const handleSummarize = async (id, e) => {
    e.stopPropagation();
    setSummarizingId(id);
    try {
      const response = await api.post(`/records/${id}/summarize`, { language: 'English' });
      setActiveSummary(response.data.summary);
      setShowSummaryModal(true);
      toast.success('Summary generated successfully!');
      fetchPatientDetails();
    } catch (error) {
      console.error('Error summarizing record:', error);
      toast.error('Failed to generate summary.');
    } finally {
      setSummarizingId(null);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  useEffect(() => {
    let socket;

    const doctorId = doctorUser?.id || doctorUser?._id;
    if (doctorId) {
      socket = getSocket();
      
      const joinRoom = () => socket.emit('join_room', { room: doctorId });
      socket.on('connect', joinRoom);
      if (socket.connected) joinRoom();

      const handleCallInvite = (data) => {
        setIncomingCall({
          callId: data.callId,
          consultationId: data.consultationId,
          mode: data.mode,
          peerUserId: data.caller.id,
          peerUserName: data.caller.name,
          isInitiator: false,
        });
      };

      const handleCallEnd = (data) => {
        if (activeCall?.callId === data.callId) {
          setActiveCall(null);
          toast('Call ended');
        }
      };

      socket.on('consultation_call_invite', handleCallInvite);
      socket.on('consultation_call_end', handleCallEnd);

      return () => {
        socket.off('consultation_call_invite', handleCallInvite);
        socket.off('consultation_call_end', handleCallEnd);
        socket.off('connect', joinRoom);
      };
    }

    return undefined;
  }, [doctorUser?.id, activeCall?.callId]);

  const fetchPatientDetails = async () => {
    try {
      const response = await api.get(`/doctors/patient/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent || !patient?.patientProfile?.id) return;

    setSubmitting(true);
    try {
      await api.post('/doctors/notes', {
        patientProfileId: patient.patientProfile.id,
        title: noteTitle,
        content: noteContent
      });
      toast.success('Consultation note saved');
      setNoteContent('');
      fetchPatientDetails();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const latestConsultation = patient?.patientProfile?.notes?.[0];
    if (latestConsultation?.id && !prescriptionForm.consultationId) {
      setPrescriptionForm((current) => ({
        ...current,
        consultationId: latestConsultation.id,
        diagnosis: latestConsultation.title === 'Consultation Note' ? '' : latestConsultation.title || '',
        notes: latestConsultation.note || '',
      }));
    }
  }, [patient?.patientProfile?.notes, prescriptionForm.consultationId]);

  const handleSavePrescription = async (event) => {
    event.preventDefault();
    if (!prescriptionForm.consultationId) {
      toast.error('Create or select a consultation before saving a prescription');
      return;
    }

    setSavingPrescription(true);
    try {
      await api.post(`/consultations/${prescriptionForm.consultationId}/prescription`, {
        diagnosis: prescriptionForm.diagnosis,
        notes: prescriptionForm.notes,
        prescription: prescriptionForm.medicines.filter(m => m.medicine.trim() !== ''),
      });
      toast.success('Prescription saved with your digital signature details');
      setPrescriptionForm((current) => ({
        ...current,
        medicines: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
        notes: '',
      }));
      fetchPatientDetails();
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error('Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  const startCall = (mode) => {
    const latestNote = patient?.patientProfile?.notes?.[0];
    const consultationId = latestNote?.id || `consult_${Date.now()}`;

    const socket = getSocket();
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    setActiveCall({
      callId,
      consultationId,
      mode,
      peerUserId: patient.id,
      peerUserName: patient.name,
      isInitiator: false,
    });

    const inviteData = {
      callId,
      consultationId,
      targetUserId: patient.id,
      mode,
      caller: {
        id: doctorUser?.id || doctorUser?._id,
        name: `Dr. ${doctorUser.name}`,
      },
    };
    
    console.log('[Socket] EMITTING CALL INVITE:', inviteData);
    socket.emit('consultation_call_invite', inviteData);
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
        id: doctorUser.id,
        name: `Dr. ${doctorUser.name}`,
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
        id: doctorUser.id,
        name: `Dr. ${doctorUser.name}`,
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Patient Not Found</h2>
          <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto p-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-8 font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <header className="mb-10 overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-2xl shadow-blue-900/15">
          <div className="relative p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.45),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.28),transparent_30%)]" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-white/12 text-white ring-1 ring-white/20 backdrop-blur-md shadow-2xl shadow-blue-950/40">
                  <User className="h-12 w-12" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">Patient Workspace</p>
                  <h1 className="mt-2 text-4xl font-black tracking-tight text-white">{patient.name}</h1>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-black text-white ring-1 ring-white/15">{patient.patientProfile?.bloodGroup || 'No Blood Group'}</span>
                    <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-200 ring-1 ring-emerald-300/20">Active Patient</span>
                    {patient.patientProfile?.consultingDoctor && (
                      <span className="flex items-center gap-1 rounded-full bg-indigo-400/15 px-4 py-2 text-xs font-black text-indigo-100 ring-1 ring-indigo-200/20">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Dr. {patient.patientProfile.consultingDoctor.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
                <button
                  onClick={() => startCall('video')}
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-blue-500 px-5 py-4 font-black text-white shadow-xl shadow-blue-950/30 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-400"
                >
                  <Video className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  Start Video Call
                </button>
                <button
                  onClick={() => startCall('voice')}
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white shadow-xl shadow-emerald-950/25 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-400"
                >
                  <Phone className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  Voice Call
                </button>
                <button
                  onClick={() => setActiveChat({ id: patient.id, name: patient.name })}
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-white/12 px-5 py-4 font-black text-white ring-1 ring-white/15 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/18"
                >
                  <MessageSquare className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  Open Chat
                </button>
                <button
                  onClick={handleGenerateOverview}
                  disabled={generatingOverview || !patient?.patientProfile?.records?.length}
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 px-5 py-4 font-black text-white shadow-xl shadow-indigo-950/30 transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 animate-[glow-pulse_5.5s_ease-in-out_infinite]"
                >
                  {generatingOverview ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <BrainCircuit className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  )}
                  Whole Picture Summary
                </button>
              </div>
            </div>
          </div>
        </header>

        {patient.patientProfile?.consultingDoctorId === doctorUser?.id && (
           <div className="mb-8 flex items-center justify-between rounded-[2rem] bg-indigo-50/90 p-5 shadow-lg shadow-indigo-100/60">
             <div className="flex items-center gap-4">
               <div className="p-2 bg-indigo-100 rounded-lg">
                 <ShieldCheck className="w-6 h-6 text-indigo-600" />
               </div>
               <div>
                 <p className="font-bold text-indigo-900">Assigned Provider</p>
                 <p className="text-sm text-indigo-600">You are the primary consulting doctor for this patient.</p>
               </div>
             </div>
           </div>
        )}

        {/* Tab Switcher */}
        <div className="mb-10 flex p-1.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-white dark:border-slate-800 w-fit shadow-xl shadow-blue-900/5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-[1.6rem] font-black text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Patient Dashboard
          </button>
          <button
            onClick={() => setActiveTab('consultation')}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-[1.6rem] font-black text-sm transition-all ${
              activeTab === 'consultation'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-500 hover:text-blue-600'
            }`}
          >
            <ClipboardPlus className="w-4 h-4" />
            Clinical Consultation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'consultation' ? (
              <>
                <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-primary" />
                    Add Consultation Note
                  </h3>
                  <form onSubmit={handleAddNote} className="space-y-4">
                    <input 
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note Title"
                      className="w-full rounded-2xl bg-slate-50/80 px-5 py-4 font-bold text-slate-800 outline-none ring-1 ring-slate-100 transition-all focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />
                    <textarea 
                      rows="4"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full resize-none rounded-2xl bg-slate-50/80 px-5 py-4 font-medium text-slate-700 outline-none ring-1 ring-slate-100 transition-all focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      placeholder="Enter medical findings, prescriptions, or advice..."
                    />
                    <button 
                      disabled={submitting || !noteContent}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 disabled:bg-slate-300 disabled:shadow-none w-full md:w-auto"
                    >
                      {submitting ? 'Saving...' : 'Save Consultation Note'}
                    </button>
                  </form>
                </section>

                <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-emerald-500" />
                    Write Prescription
                  </h3>
                  <form onSubmit={handleSavePrescription} className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultation</span>
                      <select
                        value={prescriptionForm.consultationId}
                        onChange={(event) => setPrescriptionForm((current) => ({ ...current, consultationId: event.target.value }))}
                        className="w-full rounded-2xl bg-slate-50/80 px-5 py-4 font-bold text-slate-800 outline-none ring-1 ring-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      >
                        <option value="">Select consultation</option>
                        {patient.patientProfile?.notes?.map((note) => (
                          <option key={note.id} value={note.id}>
                            {note.title || 'Consultation'} - {new Date(note.date || Date.now()).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      value={prescriptionForm.diagnosis}
                      onChange={(event) => setPrescriptionForm((current) => ({ ...current, diagnosis: event.target.value }))}
                      placeholder="Diagnosis"
                      className="rounded-2xl bg-slate-50/80 px-5 py-4 font-bold text-slate-800 outline-none ring-1 ring-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-600/10 md:col-span-2"
                    />
                    
                    {/* Medicines Array */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Medications</span>
                        <button
                          type="button"
                          onClick={() => setPrescriptionForm(curr => ({
                            ...curr,
                            medicines: [...curr.medicines, { medicine: '', dosage: '', duration: '', instructions: '' }]
                          }))}
                          className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                        >
                          + Add Medicine
                        </button>
                      </div>
                      
                      {prescriptionForm.medicines.map((med, index) => (
                        <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 relative">
                          {prescriptionForm.medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPrescriptionForm(curr => ({
                                ...curr,
                                medicines: curr.medicines.filter((_, i) => i !== index)
                              }))}
                              className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm"
                            >
                              ✕
                            </button>
                          )}
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <input
                              value={med.medicine}
                              onChange={(e) => {
                                const newMeds = [...prescriptionForm.medicines];
                                newMeds[index].medicine = e.target.value;
                                setPrescriptionForm(curr => ({ ...curr, medicines: newMeds }));
                              }}
                              placeholder="Medicine name"
                              required
                              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              value={med.dosage}
                              onChange={(e) => {
                                const newMeds = [...prescriptionForm.medicines];
                                newMeds[index].dosage = e.target.value;
                                setPrescriptionForm(curr => ({ ...curr, medicines: newMeds }));
                              }}
                              placeholder="Dosage (e.g. 1 tab)"
                              required
                              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              value={med.duration}
                              onChange={(e) => {
                                const newMeds = [...prescriptionForm.medicines];
                                newMeds[index].duration = e.target.value;
                                setPrescriptionForm(curr => ({ ...curr, medicines: newMeds }));
                              }}
                              placeholder="Duration (e.g. 5 days)"
                              required
                              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              value={med.instructions}
                              onChange={(e) => {
                                const newMeds = [...prescriptionForm.medicines];
                                newMeds[index].instructions = e.target.value;
                                setPrescriptionForm(curr => ({ ...curr, medicines: newMeds }));
                              }}
                              placeholder="Instructions (e.g. after food)"
                              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <textarea
                      rows="3"
                      value={prescriptionForm.notes}
                      onChange={(event) => setPrescriptionForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Advice and follow-up notes"
                      className="resize-none rounded-2xl bg-slate-50/80 px-5 py-4 font-medium text-slate-700 outline-none ring-1 ring-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-600/10 md:col-span-2"
                    />
                    <button
                      disabled={savingPrescription}
                      className="rounded-2xl bg-emerald-600 px-8 py-4 font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-60 md:w-fit"
                    >
                      {savingPrescription ? 'Saving...' : 'Save Prescription'}
                    </button>
                  </form>
                </section>

                {/* Latest Summary in Consultation View */}
                <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <BrainCircuit className="w-5 h-5 mr-2 text-fuchsia-500" />
                    Latest Consultation Summary
                  </h3>
                  {patient.patientProfile?.notes?.[0] ? (
                    <div className="rounded-2xl bg-slate-50/80 p-6 border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-slate-900">{patient.patientProfile.notes[0].title}</h4>
                        <span className="text-xs font-bold text-slate-400">{new Date(patient.patientProfile.notes[0].date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        "{patient.patientProfile.notes[0].content || patient.patientProfile.notes[0].note}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No previous consultation notes found.</p>
                  )}
                </section>
              </>
            ) : (

            <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Medical Timeline
              </h3>
              <div className="relative space-y-6 before:absolute before:left-[0.55rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-indigo-300 before:via-blue-200 before:to-transparent">
                {patient.patientProfile?.notes?.length > 0 ? (
                  patient.patientProfile.notes.map((note) => (
                    <div key={note.id} className="relative pl-10">
                      <div className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-200">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                      <div className="rounded-2xl bg-slate-50/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-blue-100/60">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <h4 className="font-black text-slate-900">{note.title}</h4>
                          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-400 shadow-sm">{new Date(note.date || note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">{note.content || note.note}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No medical notes found.</p>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-500" />
                Symptom Check History
              </h3>
              <div className="relative space-y-6 before:absolute before:left-[0.55rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-emerald-300 before:via-cyan-200 before:to-transparent">
                {symptomHistory?.length > 0 ? (
                  symptomHistory.map((check) => (
                    <div key={check.id} className="relative pl-10">
                      <div className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-100">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                      <div className="rounded-2xl bg-slate-50/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-emerald-100/60">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <h4 className="font-black text-slate-900">{check.predictedDisease}</h4>
                          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-400 shadow-sm">{new Date(check.date).toLocaleDateString()}</span>
                        </div>
                        <p className="mb-3 text-sm text-slate-600"><span className="font-semibold text-slate-800">Symptoms:</span> {check.symptoms}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                          <span className="rounded-md bg-indigo-100 px-2 py-1 text-indigo-700">{check.doctorSuggested}</span>
                          <span className="rounded-md bg-blue-100 px-2 py-1 text-blue-700">{check.careType}</span>
                          <span className={`rounded-md px-2 py-1 ${check.riskLevel?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' : check.riskLevel?.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>Risk: {check.riskLevel || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No symptom assessments found.</p>
                )}
              </div>
            </section>
              </>
            )}
          </div>


          <aside className="space-y-8">
            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Patient Vitals</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-rose-50/70 p-4">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-sm font-semibold text-slate-600">Allergies</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{patient.patientProfile?.allergies || 'None'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-amber-50/70 p-4">
                  <div className="flex items-center">
                    <Pill className="w-5 h-5 text-amber-500 mr-3" />
                    <span className="text-sm font-semibold text-slate-600">Medications</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{patient.patientProfile?.records?.filter(r => r.type === 'PRESCRIPTION').length || 0} Total</span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Medical Records</h3>
              <div className="space-y-3">
                {patient.patientProfile?.records?.map(record => (
                  <div key={record.id} className="group flex flex-col gap-2 rounded-2xl bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-blue-100/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center overflow-hidden">
                        <FileText className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                        <span className="text-sm font-bold text-slate-700 truncate">{record.title}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{record.type}</span>
                        <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                       <div className="flex gap-2">
                        {record.summary && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center">
                            <BrainCircuit className="w-3 h-3 mr-1" />
                            Summarized
                          </span>
                        )}
                       </div>
                       <button
                         onClick={(e) => {
                           if (record.summary) {
                             setActiveSummary(record.summary);
                             setShowSummaryModal(true);
                           } else {
                             handleSummarize(record.id, e);
                           }
                         }}
                         disabled={summarizingId === record.id}
                         className="text-xs flex items-center justify-center py-1.5 px-3 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                       >
                         {summarizingId === record.id ? (
                           <div className="w-3 h-3 border-2 border-indigo-700/20 border-t-indigo-700 rounded-full animate-spin mr-1" />
                         ) : (
                           <BrainCircuit className="w-3 h-3 mr-1" />
                         )}
                         {record.summary ? 'View Summary' : 'AI Summary'}
                       </button>
                    </div>
                  </div>
                ))}
                {patient.patientProfile?.records?.length === 0 && (
                  <p className="text-xs text-slate-400">No records uploaded.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
      {activeChat && (
        <Chat 
          otherUserId={activeChat.id} 
          otherUserName={activeChat.name} 
          onClose={() => setActiveChat(null)} 
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

      {/* Summary Modal */}
      {showSummaryModal && activeSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-2xl mr-4">
                  <BrainCircuit className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">AI Report Insights</h2>
                  <p className="text-xs text-slate-500">Summary Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              <div>
                <h4 className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                  Key Findings
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {activeSummary.key_findings.map((finding, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-medium leading-relaxed">
                      {finding}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Diagnosis</h4>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 font-bold">
                    {activeSummary.diagnosis}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recommendations</h4>
                  <ul className="space-y-2">
                    {activeSummary.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 mr-3 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed italic">
                  {activeSummary.disclaimer}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Overview Modal */}
      {showOverviewModal && healthOverview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-4 bg-white/10 rounded-2xl mr-5">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Holistic Health Status</h2>
                  <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Comprehensive AI Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowOverviewModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-10">
              <div className="bg-blue-50/50 p-6 rounded-4xl border border-blue-100">
                <h4 className="flex items-center text-xs font-black text-blue-600 uppercase tracking-widest mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                  Status Overview
                </h4>
                <p className="text-slate-700 text-lg font-medium leading-relaxed">
                  {healthOverview.status_overview}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Key Patterns & Trends</h4>
                  <div className="space-y-4">
                    {healthOverview.key_trends.map((trend, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 mr-4 text-[10px] font-black">
                          ✓
                        </div>
                        <p className="text-sm text-slate-600 font-bold leading-relaxed">{trend}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Areas of Concern</h4>
                  <div className="space-y-4">
                    {healthOverview.concerns.map((concern, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 mr-4 text-[10px] font-black">
                          !
                        </div>
                        <p className="text-sm text-slate-600 font-bold leading-relaxed">{concern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
                <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-6">Long-term Health Roadmap</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {healthOverview.long_term_advice.map((advice, idx) => (
                    <div key={idx} className="p-4 bg-white/10 rounded-2xl border border-white/5 text-sm font-bold flex items-center">
                      {advice}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider italic">
                  Analysis rendered in English • {healthOverview.disclaimer}
                </p>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowOverviewModal(false)}
                className="px-10 py-4 bg-slate-900 text-white rounded-3xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;
