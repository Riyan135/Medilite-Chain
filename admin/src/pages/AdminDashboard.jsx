import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Users, UserCheck, ShieldAlert, BarChart3, ArrowRight, Trash2, ShieldCheck, MessageSquare, Pill, User, Calendar, ClipboardList } from 'lucide-react';
import api from '../api/api';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';

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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Command Center</h1>
          <p className="text-slate-500 mt-1">Monitor system health and manage medical professionals.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-slide-up-fade">
          <StatCard 
            title="Total Patients" 
            value={loading ? "..." : (patients.length || "0")} 
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

        <div className="grid grid-cols-1 gap-8">
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Patient Directory</h3>
              <p className="text-sm text-slate-400 font-medium">{patients.length} Registered Patients</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Records</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Consulting Doctor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map(patient => (
                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 font-bold text-blue-600 text-sm border border-blue-100">
                            {patient.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{patient.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                            {patient.patientProfile?.records?.length || 0} Records
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {patient.patientProfile?.consultingDoctor ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-600 font-bold">
                              DR
                            </div>
                            <span className="text-sm font-medium text-slate-700">Dr. {patient.patientProfile.consultingDoctor.name}</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowAssignModal(patient)}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Assign Doctor
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setActiveChat({ id: patient.id, name: patient.name })}
                            className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chat with Patient"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
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
        </div>
      </main>

      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Assign Consulting Doctor</h2>
            <p className="text-sm text-slate-500 mb-4 font-medium italic underline underline-offset-4 decoration-primary/20">Assigning for: {showAssignModal.name}</p>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {doctors.map(doc => (
                <button 
                  key={doc.id}
                  onClick={() => handleAssignDoctor(showAssignModal.id, doc.id)}
                  className="w-full flex items-center p-4 bg-slate-50 hover:bg-primary/5 border border-slate-100 hover:border-primary/20 rounded-xl transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mr-4">
                    DR
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Dr. {doc.name}</h4>
                    <p className="text-xs text-slate-400">{doc.email}</p>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAssignModal(null)}
              className="w-full mt-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
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
    </div>
  );
};

export default AdminDashboard;
