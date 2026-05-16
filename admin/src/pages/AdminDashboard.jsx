import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import { 
  Users, UserCheck, ShieldAlert, BarChart3, ArrowRight, Trash2, 
  ShieldCheck, MessageSquare, Pill, User, Calendar, ClipboardList, 
  Phone, Video, Package2, AlertTriangle, Activity, Zap, Star, QrCode
} from 'lucide-react';
import api from '../api/api';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import ConsultationCallModal from '../components/ConsultationCallModal';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const StatCard = ({ title, value, subtitle, icon: Icon, theme, onClick, index }) => {
  const themes = {
    blue: {
      bg: "bg-blue-50/80 dark:bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100/50 dark:border-blue-500/20",
      glow: "shadow-blue-500/10",
      accent: "bg-blue-600"
    },
    emerald: {
      bg: "bg-emerald-50/80 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100/50 dark:border-emerald-500/20",
      glow: "shadow-emerald-500/10",
      accent: "bg-emerald-600"
    },
    cyan: {
      bg: "bg-cyan-50/80 dark:bg-cyan-500/10",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-100/50 dark:border-cyan-500/20",
      glow: "shadow-cyan-500/10",
      accent: "bg-cyan-600"
    },
    indigo: {
      bg: "bg-indigo-50/80 dark:bg-indigo-500/10",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-100/50 dark:border-indigo-500/20",
      glow: "shadow-indigo-500/10",
      accent: "bg-indigo-600"
    }
  };
  
  const t = themes[theme] || themes.blue;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden cursor-pointer group ${t.glow}`}
    >
      <div className={`absolute top-0 right-0 w-2.5 h-full ${t.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      <div className="flex items-center justify-between mb-8">
        <div className={`p-5 rounded-2xl ${t.bg} border ${t.border} transition-transform group-hover:scale-110 duration-500`}>
          <Icon className={`w-8 h-8 ${t.text}`} />
        </div>
      </div>
      
      <div>
        <p className="text-slate-400 dark:text-slate-500 font-medium text-[10px] uppercase tracking-widest mb-1.5">{title}</p>
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
          {value}
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${t.bg} ${t.text}`}>
            {subtitle}
          </span>
        </div>
      </div>
    </motion.div>
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
  const [pendingAppointments, setPendingAppointments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let socket;
    if (user?.role === 'DOCTOR' && user?.id) {
      socket = getSocket();
      socket.emit('join_room', { room: user.id });
      socket.on('incoming_appointment', (appointment) => {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-white dark:bg-slate-900 border border-blue-500/20 p-5 rounded-3xl shadow-2xl flex flex-col gap-4 min-w-[320px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">New Appointment Request</p>
                <p className="text-xs font-bold text-slate-500">Patient: {appointment.patient?.user?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { handleAppointmentStatus(appointment, 'ACCEPTED'); toast.dismiss(t.id); }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold">Accept</button>
              <button onClick={() => toast.dismiss(t.id)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-2.5 rounded-xl text-xs font-bold">Ignore</button>
            </div>
          </motion.div>
        ));
      }, { duration: Infinity });
    }
    return () => socket?.disconnect();
  }, [user]);

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

      if (user?.role === 'DOCTOR') {
        const pendingRes = await api.get('/appointments/pending');
        setPendingAppointments(pendingRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentStatus = async (appointment, status) => {
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { status });
      toast.success('Appointment status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-500">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto px-6 pb-12 pt-10 md:px-12 md:pt-12 custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
            <AdminTopbar
              title="Doctor Command Center"
              subtitle="Real-time clinical intelligence and patient management workspace."
            />
        </motion.div>

        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <StatCard 
            title="My Patients" 
            value={loading ? "..." : (stats?.myPatientsCount || "0")} 
            subtitle="Clinical Reach" 
            icon={Users} 
            theme="blue"
            index={0}
          />
          <StatCard 
            title="Today's Load" 
            value={loading ? "..." : (stats?.appointmentsToday || "0")} 
            subtitle={`${stats?.pendingAppointments || 0} Waiting`} 
            icon={Activity} 
            theme="emerald"
            index={1}
          />
          <StatCard 
            title="Active Consults" 
            value={loading ? "..." : (stats?.ongoingConsultations || "0")} 
            subtitle="In Session" 
            icon={Zap} 
            theme="cyan"
            index={2}
          />
          <StatCard 
            title="Care Score" 
            value="98%" 
            subtitle="Patient Satisfaction" 
            icon={Star} 
            theme="indigo"
            index={3}
          />
        </motion.section>

        {/* Quick Actions */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <div 
            onClick={() => navigate('/scan')}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-10 cursor-pointer shadow-2xl shadow-blue-600/20 hover:scale-[1.01] transition-all"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <QrCode className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Clinical Protocol v2.4</span>
                </div>
                <h3 className="text-4xl font-black text-white mb-3">Scan Patient Record</h3>
                <p className="text-blue-100 font-medium max-w-xl leading-relaxed">
                  Instantly access patient clinical history, AI-summarized health overviews, and encrypted medical records by scanning their MediLite QR code.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-white font-black text-xl">Launch Scanner</p>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-70">Requires Camera Access</p>
                </div>
                <div className="w-16 h-16 rounded-[2rem] bg-white text-blue-600 flex items-center justify-center shadow-xl group-hover:translate-x-2 transition-transform">
                  <ArrowRight className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8">
          <motion.section 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="glass-card rounded-[3rem] overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-white/40 dark:bg-slate-900/40">
              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {user?.role === 'DOCTOR' ? 'Clinical Queue' : 'Patient Roster'}
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-2">
                  {user?.role === 'DOCTOR' ? 'Pending Appointments' : 'Live Clinical Queue'}
                </p>
              </div>
              <button className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">
                <Calendar className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
                    <th className="px-6 py-4">{user?.role === 'DOCTOR' ? 'Patient' : 'Clinical Profile'}</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">{user?.role === 'DOCTOR' ? 'Time' : 'Assignment'}</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(user?.role === 'DOCTOR' ? pendingAppointments : patients).map((item, idx) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white/40 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xl rounded-[2rem]"
                    >
                      <td className="px-8 py-5 rounded-l-[2rem]">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {(item.name || item.patient?.user?.name || 'P')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                              {item.name || item.patient?.user?.name}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                              {item.email || item.patient?.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          (item.status === 'PENDING') ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {item.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {user?.role === 'DOCTOR' ? `${item.date} • ${item.time}` : (item.patientProfile?.consultingDoctor ? `Dr. ${item.patientProfile.consultingDoctor.name}` : 'Unassigned')}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-right rounded-r-[2rem]">
                        {user?.role === 'DOCTOR' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleAppointmentStatus(item, 'ACCEPTED')}
                              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleAppointmentStatus(item, 'REJECTED')}
                              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => navigate(`/patient/${item.id}`)}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all group"
                          >
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <aside className="space-y-8">
            <motion.section 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="glass-card rounded-[3rem] p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-24 h-24 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8">System Health</h3>
              <div className="space-y-8">
                {[
                  { label: 'Cloud Sync', status: 'Optimal', color: 'text-emerald-500' },
                  { label: 'Blockchain', status: 'Verified', color: 'text-blue-500' },
                  { label: 'Security', status: 'Secured', color: 'text-indigo-500' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <p className="text-base font-black text-slate-500">{item.label}</p>
                    <p className={`text-sm font-black uppercase tracking-widest ${item.color}`}>{item.status}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-8 text-white shadow-2xl shadow-blue-600/20"
            >
              <h3 className="text-xl font-black mb-4">Doctor Support</h3>
              <p className="text-blue-100 text-sm font-medium mb-6 leading-relaxed">
                Need technical assistance or clinical workflow help? Our priority line is open.
              </p>
              <button className="w-full py-4 bg-white text-blue-700 rounded-2xl font-black text-sm hover:bg-blue-50 transition-colors shadow-lg">
                Contact Support
              </button>
            </motion.section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
