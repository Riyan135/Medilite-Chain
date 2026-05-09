import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import { Users, UserCheck, ShieldAlert, BarChart3, ArrowRight, Trash2, ShieldCheck, MessageSquare, Pill, User, Calendar, ClipboardList, Phone, Video, Package2, AlertTriangle } from 'lucide-react';
import api from '../api/api';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import ConsultationCallModal from '../components/ConsultationCallModal';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, subtitle, icon: Icon, theme, onClick }) => {
  const themes = {
    blue: {
      bg: "bg-blue-50/50 dark:bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-500/20",
      gradient: "from-blue-400/20 to-blue-600/20 dark:from-blue-500/10 dark:to-blue-600/10"
    },
    emerald: {
      bg: "bg-emerald-50/50 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-500/20",
      gradient: "from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/10 dark:to-teal-500/10"
    },
    cyan: {
      bg: "bg-cyan-50/50 dark:bg-cyan-500/10",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-100 dark:border-cyan-500/20",
      gradient: "from-cyan-400/20 to-blue-400/20 dark:from-cyan-500/10 dark:to-blue-500/10"
    },
    indigo: {
      bg: "bg-indigo-50/50 dark:bg-indigo-500/10",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-500/20",
      gradient: "from-indigo-400/20 to-purple-400/20 dark:from-indigo-500/10 dark:to-purple-500/10"
    }
  };
  
  const t = themes[theme] || themes.blue;

  const CardElement = onClick ? 'button' : 'div';

  return (
    <CardElement
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-[2rem] p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/80 dark:hover:border-slate-700 group ${onClick ? 'w-full text-left cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/15' : ''}`}
    >
      <div className={`absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br ${t.gradient} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
      <div className={`absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr ${t.gradient} rounded-full blur-2xl opacity-50`}></div>
      
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`p-4 rounded-[1.25rem] ${t.bg} border ${t.border} shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm`}>
          <Icon className={`w-6 h-6 ${t.text}`} />
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm tracking-wide mb-1.5">{title}</h3>
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 drop-shadow-sm">{value}</h2>
        <div className={`inline-flex items-center ${t.bg} border ${t.border} px-3 py-1.5 rounded-xl text-xs font-bold ${t.text} shadow-sm`}>
          {subtitle}
        </div>
      </div>
    </CardElement>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  const patientTrend = patients
    .reduce((acc, patient) => {
      const key = patient.lastPortalLoginAt
        ? new Date(patient.lastPortalLoginAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        : 'No Login';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const patientTrendData = Object.entries(patientTrend)
    .filter(([label]) => label !== 'No Login')
    .slice(-6)
    .map(([label, count]) => ({ label, count }));
  const maxTrend = Math.max(...patientTrendData.map((item) => item.count), 1);

  const showAppointmentToast = (appointment) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[250px]">
        <p className="font-bold text-slate-800 dark:text-white text-base">New Appointment Request</p>
        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Patient: {appointment.patient?.user?.name || "Unknown Patient"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{appointment.date} @ {appointment.time}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            onClick={() => {
              handleAppointmentStatus(appointment, 'ACCEPTED');
              toast.dismiss(t.id);
            }}
          >Accept</button>
          <button
            className="flex-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            onClick={() => {
              handleAppointmentStatus(appointment, 'REJECTED');
              toast.dismiss(t.id);
            }}
          >Decline</button>
        </div>
      </div>
    ), { duration: 60000, position: 'top-center' });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let socket;

    if (user?.role === 'DOCTOR' && user?.id) {
      socket = getSocket();
      socket.emit('join_room', { room: user.id });

      fetchPendingAppointments();

      socket.on('incoming_appointment', (appointment) => {
        showAppointmentToast(appointment);
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
      socket.on('consultation_call_end', (data) => {
        if (activeCall?.callId === data.callId) {
          setActiveCall(null);
          toast('Call ended');
        }
      });
    }

    return () => {
      socket?.off('incoming_appointment');
      socket?.off('consultation_call_invite');
      socket?.off('consultation_call_end');
    };
  }, [user?.id, user?.role, activeCall?.callId]);

  const fetchData = async () => {
    try {
      const [statsRes, patientsRes, doctorsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/patients'),
        api.get('/admin/doctors')
      ]);
      setStats(statsRes.data);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDoctor = async (patientId, doctorId) => {
    try {
      await api.post('/admin/assign-doctor', { patientId, doctorId });
      toast.success('Doctor assigned successfully');
      setShowAssignModal(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning doctor:', error);
      toast.error('Failed to assign doctor');
    }
  };

  const handleAppointmentStatus = async (appointment, status) => {
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { status });

      if (status === 'ACCEPTED') toast.success('Appointment confirmed and patient notified');
      else toast.success('Appointment declined and patient notified');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const fetchPendingAppointments = async () => {
    try {
      const response = await api.get('/appointments/pending');
      response.data.forEach(showAppointmentToast);
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
    }
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
    <div className="flex min-h-screen bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Doctor Command Center"
          subtitle="Review patient activity, manage appointments, and monitor medicine stock from one workspace."
        />

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-slide-up-fade">
          <StatCard 
            title="Total Patients" 
            value={loading ? "..." : (stats?.loggedInPatients || "0")} 
            subtitle="Patients who logged into the portal" 
            icon={Users} 
            theme="blue"
            onClick={() => document.getElementById('patient-overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
          <StatCard 
            title="Appointments Today" 
            value={loading ? "..." : (stats?.appointmentsToday || "0")} 
            subtitle={`${stats?.pendingAppointments || 0} pending requests`} 
            icon={Calendar} 
            theme="emerald"
            onClick={() => navigate('/appointments')}
          />
          <StatCard 
            title="Total Consultations" 
            value={loading ? "..." : (stats?.totalConsultations || "0")} 
            subtitle={`${stats?.ongoingConsultations || 0} ongoing`} 
            icon={ClipboardList} 
            theme="cyan"
            onClick={() => navigate('/consultations')}
          />
          <StatCard 
            title="Completed Consultations" 
            value={loading ? "..." : (stats?.completedConsultations || "0")} 
            subtitle={`${stats?.acceptedAppointments || 0} accepted appointments`} 
            icon={Pill} 
            theme="indigo"
            onClick={() => navigate('/consultations')}
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Total Medicines"
            value={loading ? "..." : (stats?.totalMedicines || "0")}
            subtitle="Inventory items in stock"
            icon={Package2}
            theme="blue"
            onClick={() => navigate('/medicines')}
          />
          <StatCard
            title="Low Stock Alerts"
            value={loading ? "..." : (stats?.lowStockMedicines || "0")}
            subtitle="Below threshold"
            icon={AlertTriangle}
            theme="emerald"
            onClick={() => navigate('/medicines')}
          />
          <StatCard
            title="Expired Medicines"
            value={loading ? "..." : (stats?.expiredMedicines || "0")}
            subtitle={`${stats?.nearExpiryMedicines || 0} near expiry`}
            icon={ShieldAlert}
            theme="indigo"
            onClick={() => navigate('/medicines')}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-8">
          <section id="patient-overview" className="scroll-mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center bg-white/40 dark:bg-slate-900/40">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Patient Overview
              </h3>
              <p className="text-sm text-slate-400 font-medium">
                {stats?.loggedInPatients || 0} Logged In Patients
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Records</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Consulting Doctor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {patients.map(patient => (
                    <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mr-3 font-bold text-blue-600 dark:text-blue-400 text-sm border border-blue-100 dark:border-blue-500/20">
                            {patient.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{patient.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                            {patient.patientProfile?.records?.length || 0} Records
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {patient.patientProfile?.consultingDoctor ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              DR
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dr. {patient.patientProfile.consultingDoctor.name}</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowAssignModal(patient)}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Assign Doctor
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setActiveChat({ id: patient.id, name: patient.name })}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Chat with Patient"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                            onClick={() => navigate(`/patient/${patient.id}`)}
                            title="View Records"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Quick System Flags</h3>
              <div className="mt-6 space-y-4">
                <FlagRow label="Pending Appointments" value={stats?.pendingAppointments || 0} tone="yellow" />
                <FlagRow label="Ongoing Consultations" value={stats?.ongoingConsultations || 0} tone="blue" />
                <FlagRow label="Low Stock Medicines" value={stats?.lowStockMedicines || 0} tone="red" />
                <FlagRow label="Expired Medicines" value={stats?.expiredMedicines || 0} tone="red" />
              </div>
            </section>
          </aside>
        </div>
      </main>

      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Assign Consulting Doctor</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium italic underline underline-offset-4 decoration-blue-500/20">Assigning for: {showAssignModal.name}</p>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {doctors.map(doc => (
                <button 
                  key={doc.id}
                  onClick={() => handleAssignDoctor(showAssignModal.id, doc.id)}
                  className="w-full flex items-center p-4 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/20 rounded-xl transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mr-4">
                    DR
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dr. {doc.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{doc.email || doc.phone || 'Available doctor'}</p>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAssignModal(null)}
              className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeChat && (
        <Chat 
          otherUserId={activeChat.id} 
          otherUserName={activeChat.name} 
          onClose={() => setActiveChat(null)} 
        />
      )}
      {incomingCall && (
        <div className="fixed top-6 right-6 z-[65] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2rem] p-6 w-full max-w-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Incoming {incomingCall.mode === 'video' ? 'video' : 'voice'} consultation call
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{incomingCall.peerUserName}</h3>
          <div className="mt-5 flex gap-3">
            <button onClick={acceptIncomingCall} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold">
              Accept
            </button>
            <button onClick={rejectIncomingCall} className="flex-1 py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-500/20">
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
    </div>
  );
};

const FlagRow = ({ label, value, tone }) => {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
    yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20',
    red: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20',
  };

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
      <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${styles[tone]}`}>{value}</span>
    </div>
  );
};

export default AdminDashboard;
