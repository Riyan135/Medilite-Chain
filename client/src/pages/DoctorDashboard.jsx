import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { QrCode, Search, User, ShieldCheck, Clock, ArrowRight, MessageSquare, Users, Calendar, ClipboardList, Pill } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import QRScannerModal from '../components/QRScannerModal';
import toast from 'react-hot-toast';
import Chat from '../components/Chat';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');

const StatCard = ({ title, value, subtitle, icon: Icon, theme }) => {
  const themes = {
    blue: {
      bg: "bg-blue-50/50",
      text: "text-blue-600",
      border: "border-blue-100",
      gradient: "from-blue-400/20 to-blue-600/20"
    },
    emerald: {
      bg: "bg-emerald-50/50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      gradient: "from-emerald-400/20 to-teal-400/20"
    },
    cyan: {
      bg: "bg-cyan-50/50",
      text: "text-cyan-600",
      border: "border-cyan-100",
      gradient: "from-cyan-400/20 to-blue-400/20"
    },
    indigo: {
      bg: "bg-indigo-50/50",
      text: "text-indigo-600",
      border: "border-indigo-100",
      gradient: "from-indigo-400/20 to-purple-400/20"
    }
  };

  const t = themes[theme] || themes.blue;

  return (
    <div className="relative overflow-hidden rounded-[2rem] p-6 bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/80 group">
      <div className={`absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br ${t.gradient} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
      <div className={`absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr ${t.gradient} rounded-full blur-2xl opacity-50`}></div>

      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`p-4 rounded-[1.25rem] ${t.bg} border ${t.border} shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 backdrop-blur-sm`}>
          <Icon className={`w-6 h-6 ${t.text}`} />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-slate-500 font-semibold text-sm tracking-wide mb-1.5">{title}</h3>
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4 drop-shadow-sm">{value}</h2>
        <div className={`inline-flex items-center ${t.bg} border ${t.border} px-3 py-1.5 rounded-xl text-xs font-bold ${t.text} shadow-sm`}>
          {subtitle}
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [recentPatients, setRecentPatients] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showScanner, setShowScanner] = useState(false);


  useEffect(() => {
    if (user?.id) {
      fetchRecentConsultations();

      // Join doctor room for real-time notifications
      socket.emit('join_room', { room: user.id });

      socket.on('incoming_appointment', (appointment) => {
        toast((t) => (
          <div className="flex flex-col gap-3 min-w-[250px]">
            <p className="font-bold text-slate-800 text-base">New Appointment Request</p>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-700 font-medium">Patient: {appointment.patient?.user?.name || "Unknown Patient"}</p>
              <p className="text-xs text-slate-500 mt-1">{appointment.date} @ {appointment.time}</p>
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
                className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                onClick={() => {
                  handleAppointmentStatus(appointment, 'REJECTED');
                  toast.dismiss(t.id);
                }}
              >Decline</button>
            </div>
          </div>
        ), { duration: 60000, position: 'top-center' }); // Stay for 1 minute
      });
    }

    return () => {
      socket.off('incoming_appointment');
    };
  }, [user?.id]);

  const handleAppointmentStatus = async (appointment, status) => {
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { status });
      socket.emit('appointment_status_update', {
        patientUserId: appointment.patient.user.id,
        appointment: { ...appointment, status }
      });
      if (status === 'ACCEPTED') toast.success('Appointment confirmed and patient notified');
      else toast.success('Appointment declined and patient notified');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update appointment status');
    }
  };

  const fetchRecentConsultations = async () => {
    try {
      const response = await api.get('/doctors/recent');
      setRecentPatients(response.data);
    } catch (error) {
      console.error('Error fetching recent consultations:', error);
    }
  };

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchId) {
      setLoading(true);
      try {
        const response = await api.get(`/doctors/search?query=${searchId}`);
        setSearchResults(response.data);
        if (response.data.length === 0) {
          toast.error('No patients found with that ID');
        } else {
          toast.success(`Found ${response.data.length} results`);
        }
      } catch (error) {
        console.error('Error searching patients:', error);
        toast.error('Failed to search patients');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePatientSelect = (id) => {
    navigate(`/doctor/patient/${id}`);
  };

  const onScanSuccess = (decodedText) => {
    // If it's a patient access token
    if (decodedText.startsWith('medilite-access-token-')) {
      const parts = decodedText.split('-');
      const clerkId = parts[3]; // format: medilite-access-token-{clerkId}-{timestamp}
      if (clerkId) {
        setShowScanner(false);
        handlePatientSelect(clerkId);
      }
    }
    // If it's a specific report QR (JSON format)
    try {
      const data = JSON.parse(decodedText);
      if (data.recordId && data.patientId) {
        setShowScanner(false);
        // For now, redirect to patient page, but we could add a direct report view
        handlePatientSelect(data.patientId);
      }
    } catch (e) {
      // Not JSON, ignore
    }
  };


  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-float pointer-events-none z-0"></div>
      <Sidebar role="doctor" />
      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Doctor Dashboard</h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">Scan patient QR or search by ID to access records securely.</p>
          </div>
          <div className="flex space-x-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search patient ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-12 pr-4 py-4 bg-white/80 backdrop-blur border border-white/60 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none w-full md:w-80 transition-all font-medium text-slate-900 shadow-sm"
              />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-slide-up-fade">
          <StatCard
            title="Total Patients"
            value="1,245"
            subtitle="+5% from last week"
            icon={Users}
            theme="blue"
          />
          <StatCard
            title="Appointments Today"
            value="32"
            subtitle="4 emergencies"
            icon={Calendar}
            theme="emerald"
          />
          <StatCard
            title="Consultations"
            value="850"
            subtitle="This month"
            icon={ClipboardList}
            theme="cyan"
          />
          <StatCard
            title="Prescriptions"
            value="4,120"
            subtitle="Overall generated"
            icon={Pill}
            theme="indigo"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            <section className="bg-white/70 backdrop-blur-xl p-10 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-100/50 shadow-inner group-hover:scale-110 transition-transform">
                <QrCode className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">QR Access Control</h2>
              <p className="text-lg text-slate-500 max-w-md mb-8 font-medium">
                Enter the patient's temporary access token or scan their emergency QR code to proceed.
              </p>

              <div className="flex flex-col sm:flex-row w-full max-w-lg gap-3 mb-8">
                <input
                  type="text"
                  placeholder="Enter access token..."
                  className="flex-1 px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
                <button
                  onClick={() => {
                    let id = searchId;
                    if (searchId.includes('medilite-access-token-')) {
                      id = searchId.split('-').reverse()[1];
                    }
                    if (id) handlePatientSelect(id);
                  }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/25 transition-all duration-300 shadow-lg shadow-blue-600/20"
                >
                  Access
                </button>
              </div>

              <div className="flex items-center gap-4 w-full max-w-lg">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">OR</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="mt-8 w-full max-w-lg">
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center shadow-sm group"
                >
                  <QrCode className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  Open Camera Scanner
                </button>
              </div>
            </section>


            <section className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50">
              <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Recent Consultations</h3>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-slate-400 font-medium animate-pulse">Searching securely...</p>
                ) : (searchResults.length > 0 ? searchResults : recentPatients).length > 0 ? (
                  (searchResults.length > 0 ? searchResults : recentPatients).map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient.id)}
                      className="flex items-center p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-[1rem] bg-slate-50 flex items-center justify-center mr-5 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                        <User className="w-7 h-7 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{patient.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{patient.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChat({ id: patient.id, name: patient.name });
                          }}
                          className="p-3 bg-slate-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                          title="Chat with Patient"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-500 font-medium">Search for patients or consult to see them here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-[2rem] text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[40px] translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex items-center space-x-4 mb-6 relative z-10">
                <div className="p-3 bg-white/20 backdrop-blur rounded-2xl shadow-inner border border-white/20">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Verified Access</h3>
              </div>
              <p className="text-emerald-50 text-base leading-relaxed mb-6 font-medium relative z-10">
                Your credentials have been verified by the medical board. All scans are logged for patient safety and compliance.
              </p>
              <div className="flex items-center text-xs text-emerald-100 font-bold uppercase tracking-widest relative z-10 bg-black/10 w-fit px-4 py-2 rounded-xl">
                <Clock className="w-4 h-4 mr-2" />
                Session expires in 4 hours
              </div>
            </div>
          </aside>
        </div>
      </main>

      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={onScanSuccess}
      />
      {activeChat && (
        <Chat
          otherUserId={activeChat.id}
          otherUserName={activeChat.name}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};


export default DoctorDashboard;
