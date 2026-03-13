import { PlusCircle, ArrowUpRight, Shield, Heart, FileText, Pill, MessageSquare, AlertTriangle, User } from 'lucide-react';
import MedicalRecordUpload from '../components/MedicalRecordUpload';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';

const Card = ({ title, value, icon: Icon, color }) => (
// ... existing code ...
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-xs font-medium text-slate-400">Past 30 days</span>
    </div>
    <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
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
      await api.put(`/patients/profile/${user.id}`, formData);
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 transform animate-in fade-in zoom-in duration-300">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Medical Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group</label>
            <input 
              type="text" 
              value={formData.bloodGroup}
              onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="e.g. O+ve"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Allergies</label>
            <textarea 
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none"
              placeholder="List any medicine or food allergies..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact</label>
            <input 
              type="text" 
              value={formData.emergencyContact}
              onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Name and Phone"
            />
          </div>
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 disabled:bg-slate-300">
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
  const [showUpload, setShowUpload] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      const [recordsRes, statsRes, profileRes, inventoryRes] = await Promise.all([
        api.get(`/records/patient/${user.id}`),
        api.get(`/patients/stats/${user.id}`),
        api.get(`/patients/profile/${user.id}`),
        api.get(`/inventory/${user.id}`)
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
    <div className="flex h-screen bg-slate-50">
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Patient Dashboard</h1>
            <p className="text-slate-500 mt-1">Hello, {user?.name}! Here is your health overview.</p>
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
               className="flex items-center px-5 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-2 text-primary" />
              Support Chat
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center px-5 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Upload New Record
            </button>
          </div>
        </header>

        {lowStockItems.length > 0 && (
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
        )}

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
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Recent Medical History</h2>
                <button onClick={() => navigate('/records')} className="text-primary text-sm font-bold hover:underline">View All</button>
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
                        <h4 className="font-semibold text-slate-900">{record.title}</h4>
                        <p className="text-sm text-slate-500">
                          {new Date(record.date).toLocaleDateString()} • {record.type}
                        </p>
                      </div>
                      <a
                        href={record.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium text-sm"
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

          <aside className="space-y-8">
            <section className="bg-indigo-600 p-8 rounded-2xl text-white shadow-xl shadow-indigo-200">
              <h3 className="text-lg font-bold mb-4">Emergency Profile</h3>
              <p className="text-sm text-indigo-100 mb-6">In case of emergency, doctors can access this info via your QR code.</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm py-2 border-b border-indigo-500/50">
                  <span className="text-indigo-200">Blood Group</span>
                  <span className="font-bold">{loading ? "..." : profile?.bloodGroup || "Not Set"}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-indigo-500/50">
                  <span className="text-indigo-200">Allergies</span>
                  <span className="font-bold">{loading ? "..." : profile?.allergies || "None"}</span>
                </div>
                {profile?.consultingDoctor && (
                   <div className="mt-4 pt-4 border-t border-indigo-500/50">
                      <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest mb-1">Assigned Doctor</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">DR</div>
                          <span className="font-bold">Dr. {profile.consultingDoctor.name}</span>
                        </div>
                        <button 
                          onClick={() => setActiveChat({ 
                            id: profile.consultingDoctor.id, 
                            name: `Dr. ${profile.consultingDoctor.name}` 
                          })}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="Chat with Doctor"
                        >
                          <MessageSquare className="w-4 h-4 text-white" />
                        </button>
                      </div>
                   </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/qr')}
                className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                View My QR
              </button>
            </section>
          </aside>
        </div>
      </main>
      {showUpload && (
        <MedicalRecordUpload
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
