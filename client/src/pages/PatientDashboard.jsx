import { PlusCircle, ArrowUpRight, Shield, Heart, FileText, Pill, MessageSquare, AlertTriangle, User } from 'lucide-react';
import MedicalRecordUpload from '../components/MedicalRecordUpload';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';

const Card = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1.5 transition-all duration-500 group relative overflow-hidden">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
        <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-xs font-bold text-slate-400 tracking-wider uppercase bg-slate-100/50 px-3 py-1 rounded-full">30 Days</span>
    </div>
    <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{title}</h3>
    <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
  </div>
);

const EditProfileModal = ({ profile, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: profile?.bloodGroup || '',
    allergies: profile?.allergies || '',
    emergencyContact: profile?.emergencyContact || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/patients/profile/${profile?.userId || user?.id}`, formData);
      toast.success('Medical profile updated');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-2xl w-full max-w-md rounded-[2rem] shadow-2xl p-10 border border-white/60 transform animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Edit Medical Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 tracking-wide uppercase mb-2">Blood Group</label>
            <input
              type="text"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
              placeholder="e.g. O+ve"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 tracking-wide uppercase mb-2">Allergies</label>
            <textarea
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none h-28 resize-none transition-all font-medium text-slate-900"
              placeholder="List any medicine or food allergies..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 tracking-wide uppercase mb-2">Emergency Contact</label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
              placeholder="Name and Phone"
            />
          </div>
          <div className="flex gap-4 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100/80 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/25 disabled:opacity-70 disabled:shadow-none hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { memberId } = useParams();
  const targetId = memberId || user?.id;

  const [showUpload, setShowUpload] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [dashboardName, setDashboardName] = useState(user?.name);
  const [relation, setRelation] = useState('');

  useEffect(() => {
    if (targetId) {
      fetchAllData();
      if (memberId) {
        fetchMemberDetails();
      } else {
        setDashboardName(user?.name);
        setRelation('');
      }
    }
  }, [targetId, user]);

  const fetchMemberDetails = async () => {
    try {
      const res = await api.get('/family');
      const member = res.data.find(m => m.id === memberId);
      if (member) {
        setDashboardName(member.name);
        setRelation(member.relationToParent);
      }
    } catch (error) {
      console.error('Failed to fetch family member details', error);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [recordsRes, statsRes, profileRes, inventoryRes] = await Promise.all([
        api.get(`/records/patient/${targetId}`),
        api.get(`/patients/stats/${targetId}`),
        api.get(`/patients/profile/${targetId}`),
        api.get(`/inventory/${targetId}`)
      ]);
      setRecords(recordsRes.data);
      setStats(statsRes.data);
      setProfile(profileRes.data.patientProfile);
      setInventory(inventoryRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = inventory.filter(item => item.stock <= item.minThreshold);

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-400/20 to-indigo-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-float pointer-events-none z-0"></div>
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <header className="flex justify-between items-end mb-12 flex-wrap gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {memberId ? `${dashboardName}'s Dashboard` : 'Patient Dashboard'}
            </h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">
              {memberId
                ? `Viewing health overview for your ${relation.toLowerCase()}.`
                : `Hello, ${user?.name}! Here is your health overview.`}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                try {
                  const res = await api.get('/auth/admin-id');
                  setActiveChat({ id: res.data.id, name: 'MediLite Admin' });
                } catch (e) {
                  toast.error('Support chat is currently unavailable');
                }
              }}
              className="flex items-center px-6 py-4 bg-white/70 backdrop-blur text-slate-700 border border-slate-200 rounded-2xl font-black shadow-lg shadow-slate-200/50 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              <MessageSquare className="w-5 h-5 mr-3 text-blue-600" />
              Support Chat
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-300 active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5 mr-3" />
              Upload New Record
            </button>
          </div>
        </header>


        {/* {lowStockItems.length > 0 && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-900">Low Stock Alert!</p>
                <p className="text-sm text-red-600">You have {lowStockItems.length} medicines running low.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200"
            >
              Manage Inventory
            </button>
          </div>
        )} */}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card
            title="Total Records"
            value={loading ? "..." : stats?.totalRecords || "0"}
            icon={PlusCircle}
            color="bg-blue-600"
          />
          <Card
            title="Medicine Stock"
            value={loading ? "..." : inventory.length || "0"}
            icon={Pill}
            color="bg-indigo-600"
          />
          <Card
            title="Upcoming Reminders"
            value={loading ? "..." : stats?.activeReminders || "0"}
            icon={ArrowUpRight}
            color="bg-green-600"
          />
          <Card
            title="Health Score"
            value={loading ? "..." : stats?.healthScore || "N/A"}
            icon={Shield}
            color="bg-indigo-600"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 animate-slide-up-fade" style={{animationDelay: '0.1s'}}>
            <section className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recent Medical History</h2>
                <button onClick={() => navigate('/records')} className="text-blue-600 text-sm font-bold hover:text-blue-700 hover:underline transition-colors">View All Directory</button>
              </div>
              <div className="space-y-6">
                {loading ? (
                  <p className="text-slate-400">Loading records...</p>
                ) : records.length > 0 ? (
                  records.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center p-4 rounded-xl border border-slate-100 hover:border-primary/30 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{record.title}</h4>
                        <p className="text-sm text-slate-500 font-medium">
                          {new Date(record.date).toLocaleDateString()} • <span className="uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1 font-bold">{record.type}</span>
                        </p>
                      </div>
                      <a
                        href={record.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors group-hover:shadow-sm"
                      >
                        View Report
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No records found. Upload your first report!</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8 animate-slide-up-fade" style={{animationDelay: '0.2s'}}>
            <section className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden group hover:shadow-indigo-900/40 hover:-translate-y-1 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xl font-black mb-4 tracking-tight relative z-10">Emergency Profile</h3>
              <p className="text-sm text-indigo-100 mb-8 font-medium leading-relaxed relative z-10">In case of emergency, doctors can access this info securely via your QR code.</p>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-sm py-3 border-b border-indigo-400/30">
                  <span className="text-indigo-200 font-semibold tracking-wide uppercase text-xs">Blood Group</span>
                  <span className="font-black text-lg">{loading ? "..." : profile?.bloodGroup || "Not Set"}</span>
                </div>
                <div className="flex justify-between text-sm py-3 border-b border-indigo-400/30">
                  <span className="text-indigo-200 font-semibold tracking-wide uppercase text-xs">Allergies</span>
                  <span className="font-black">{loading ? "..." : profile?.allergies || "None"}</span>
                </div>
                {profile?.consultingDoctor && (
                  <div className="mt-6 pt-4 border-t border-indigo-400/30">
                    <p className="text-[10px] text-indigo-200 font-black uppercase tracking-widest mb-3">Assigned Care Provider</p>
                    <div className="flex items-center justify-between gap-2 p-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xs font-black">DR</div>
                        <span className="font-bold tracking-tight text-white">Dr. {profile.consultingDoctor.name}</span>
                      </div>
                      <button
                        onClick={() => setActiveChat({
                          id: profile.consultingDoctor.id,
                          name: `Dr. ${profile.consultingDoctor.name}`
                        })}
                        className="p-3 bg-white hover:bg-slate-50 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-blue-600 group/btn"
                        title="Chat with Doctor"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate('/qr')}
                className="w-full mt-8 py-4 bg-white text-indigo-700 rounded-2xl font-black hover:bg-slate-50 transition-all hover:shadow-lg hover:-translate-y-1 relative z-10"
              >
                View My SOS QR
              </button>
            </section>
          </aside>
        </div>
      </main>
      {showUpload && (
        <MedicalRecordUpload
          targetId={targetId}
          onClose={() => {
            setShowUpload(false);
            fetchAllData();
          }}
        />
      )}
      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => {
            setShowEditProfile(false);
            fetchAllData();
          }}
        />
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

export default PatientDashboard;
