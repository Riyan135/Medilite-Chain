import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { User, Calendar, FileText, Plus, ArrowLeft, Pill, Activity, ShieldCheck, MessageSquare, BrainCircuit, X, AlertCircle, ExternalLink } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Chat from '../components/Chat';

const PatientDetails = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { user: doctorUser } = useAuth();
  const [patient, setPatient] = useState(null);
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
          <button onClick={() => navigate('/doctor-dashboard')} className="mt-4 text-primary font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role="doctor" />
      <main className="flex-1 overflow-y-auto p-8">
        <button 
          onClick={() => navigate('/doctor-dashboard')}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-8 font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <header className="flex justify-between items-start mb-10 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mr-6">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-extrabold text-slate-900">{patient.name}</h1>
                <button 
                  onClick={() => setActiveChat({ id: patient.id, name: patient.name })}
                  className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                  title="Chat with Patient"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{patient.patientProfile?.bloodGroup || 'No Blood Group'}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Active Patient</span>
                {patient.patientProfile?.consultingDoctor && (
                   <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1">
                     <ShieldCheck className="w-3 h-3" />
                     Dr. {patient.patientProfile.consultingDoctor.name}
                   </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-sm font-semibold text-slate-400">Patient Hash</p>
            <p className="text-lg font-bold text-slate-800 mb-4">#{patient.id.slice(-6).toUpperCase()}</p>
            <button
              onClick={handleGenerateOverview}
              disabled={generatingOverview || !patient?.patientProfile?.records?.length}
              className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50 text-sm"
            >
              {generatingOverview ? (
                 <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <BrainCircuit className="w-4 h-4 mr-2" />
              )}
              Whole Picture Summary
            </button>
          </div>
        </header>

        {patient.patientProfile?.consultingDoctorId === doctorUser?.id && (
           <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-3xl border border-slate-200">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                />
                <textarea 
                  rows="4"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder="Enter medical findings, prescriptions, or advice..."
                />
                <button 
                  disabled={submitting || !noteContent}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {submitting ? 'Saving...' : 'Save Consultation Note'}
                </button>
              </form>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Medical Timeline
              </h3>
              <div className="space-y-6">
                {patient.patientProfile?.notes?.length > 0 ? (
                  patient.patientProfile.notes.map((note) => (
                    <div key={note.id} className="relative pl-8 border-l-2 border-slate-100 pb-6">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500" />
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900">{note.title}</h4>
                        <span className="text-xs font-bold text-slate-400">{new Date(note.date || note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{note.content || note.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No medical notes found.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Patient Vitals</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-sm font-semibold text-slate-600">Allergies</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{patient.patientProfile?.allergies || 'None'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center">
                    <Pill className="w-5 h-5 text-amber-500 mr-3" />
                    <span className="text-sm font-semibold text-slate-600">Medications</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{patient.patientProfile?.records?.filter(r => r.type === 'PRESCRIPTION').length || 0} Total</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Medical Records</h3>
              <div className="space-y-3">
                {patient.patientProfile?.records?.map(record => (
                  <div key={record.id} className="flex flex-col gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
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
