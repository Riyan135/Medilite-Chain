import { PlusCircle, ArrowUpRight, Shield, Heart, FileText, Pill, MessageSquare, AlertTriangle, User, CalendarClock, Users } from 'lucide-react';
import MedicalRecordUpload from '../components/MedicalRecordUpload';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Chat from '../components/Chat';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';

const Card = ({ title, value, icon: Icon, color, onClick, interactive = false, progress = 0 }) => (
  <button
    type="button"
    onClick={onClick}
    className={`patient-dashboard-panel group relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 p-8 text-left backdrop-blur-xl ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
    disabled={!interactive}
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-blue-100/60 via-cyan-100/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
    <div className="flex justify-between items-start mb-6">
      <div className={`rounded-2xl p-4 ${color} bg-opacity-10 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
        <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-')}`} />
      </div>
      <span className="rounded-full bg-slate-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm">30 Days</span>
    </div>
    <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{title}</h3>
    <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
    <div className="mt-4 flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 transition-all duration-700 group-hover:brightness-110"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="text-xs font-black text-slate-400 tabular-nums min-w-[2.5rem] text-right">{Math.min(progress, 100)}%</span>
    </div>
  </button>
);

const HealthScoreModal = ({ profile, stats, onClose }) => {
  const breakdown = stats?.healthBreakdown || {};
  const graphItems = [
    {
      label: 'Profile Completion',
      value: breakdown.profileCompletion ?? (profile?.bloodGroup && profile?.emergencyContact ? 92 : profile?.bloodGroup || profile?.emergencyContact ? 68 : 36),
      tone: 'from-blue-500 to-cyan-400',
    },
    {
      label: 'Reminder Support',
      value: breakdown.reminderSupport ?? Math.min(100, (stats?.activeReminders || 0) * 20 + 20),
      tone: 'from-emerald-500 to-lime-400',
    },
    {
      label: 'Records Coverage',
      value: breakdown.recordsCoverage ?? Math.min(100, (stats?.totalRecords || 0) * 18 + 22),
      tone: 'from-indigo-500 to-violet-400',
    },
    {
      label: 'Safety Readiness',
      value: breakdown.safetyReadiness ?? (profile?.allergies || profile?.emergencyContact ? 82 : 48),
      tone: 'from-amber-500 to-orange-400',
    },
  ];
  const calculatedScore = Math.round(graphItems.reduce((total, item) => total + item.value, 0) / graphItems.length);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-600">Health Score Graph</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Profile breakdown</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Your health score is the average of these four readiness areas: profile completion, reminder support, records coverage, and safety readiness.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            {graphItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black tracking-wide text-slate-700">{item.label}</p>
                  <span className="text-sm font-black text-slate-900">{item.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.tone} transition-all duration-700`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Current Score</p>
            <p className="mt-3 text-6xl font-black tracking-tight text-slate-900">{stats?.healthScore ?? calculatedScore}</p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-500">
              The score improves when your blood group and emergency contact are filled, reminders are active, records are uploaded, and allergy or safety notes are updated.
            </p>

            <div className="mt-5 rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">How it is calculated</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                Score = average of the four graph percentages. It is a profile readiness score, not a medical diagnosis.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Blood Group</p>
                <p className="mt-1 text-lg font-black text-slate-900">{profile?.bloodGroup || 'Not set'}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Emergency Contact</p>
                <p className="mt-1 text-lg font-black text-slate-900">{profile?.emergencyContact || 'Not updated'}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Allergy Status</p>
                <p className="mt-1 text-lg font-black text-slate-900">{profile?.allergies || 'No allergy notes'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [showHealthGraph, setShowHealthGraph] = useState(false);
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
        api.get(`/inventory/${targetId}`),
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
    <div className="patient-dashboard-shell relative flex h-screen overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="pointer-events-none absolute left-[-12rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-sky-400/15 blur-[120px] animate-pulse z-0" />
      <div className="pointer-events-none absolute right-[-8rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-indigo-400/15 blur-[130px] animate-float z-0" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-300/15 blur-[120px] animate-pulse z-0" style={{ animationDelay: '1.2s' }} />
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <header className="patient-dashboard-panel mb-12 flex flex-wrap items-end justify-between gap-6 rounded-[2.25rem] border border-white/60 bg-white/70 p-8 backdrop-blur-2xl">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-blue-600">Health Command Center</p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {memberId ? `${dashboardName}'s Dashboard` : 'Patient Dashboard'}
            </h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">
              {memberId
                ? `Viewing health overview for your ${relation.toLowerCase()}.`
                : `Hello, ${user?.name}! Here is your health overview.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700 shadow-sm">
                Live Profile Sync
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
                Secure Health Access
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/family-profiles')}
              className="flex items-center justify-center w-14 h-14 rounded-full border border-white/70 bg-white/80 font-black text-slate-700 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
              title="Family Profiles"
            >
              <Users className="w-5 h-5 text-indigo-600" />
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await api.get('/auth/admin-id');
                  setActiveChat({ id: res.data.id, name: 'MediLite Admin' });
                } catch (e) {
                  toast.error('Support chat is currently unavailable');
                }
              }}
              className="flex items-center rounded-2xl border border-white/70 bg-white/80 px-6 py-4 font-black text-slate-700 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
            >
              <MessageSquare className="w-5 h-5 mr-3 text-blue-600" />
              Support Chat
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 px-6 py-4 font-black text-white shadow-xl shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-[0.98]"
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

        <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Total Records"
            value={loading ? "..." : stats?.totalRecords || "0"}
            icon={FileText}
            color="bg-blue-600"
            interactive
            onClick={() => navigate('/records')}
            progress={loading ? 0 : Math.min((stats?.totalRecords || 0) * 10, 100)}
          />
          <Card
            title="Medicine Stock"
            value={loading ? "..." : inventory.length || "0"}
            icon={Pill}
            color="bg-indigo-600"
            interactive
            onClick={() => navigate('/reminders')}
            progress={loading ? 0 : Math.min(inventory.length * 10, 100)}
          />
          <Card
            title="Upcoming Reminders"
            value={loading ? "..." : stats?.activeReminders || "0"}
            icon={CalendarClock}
            color="bg-green-600"
            interactive
            onClick={() => navigate('/reminders')}
            progress={loading ? 0 : Math.min((stats?.activeReminders || 0) * 20, 100)}
          />
          <Card
            title="Health Score"
            value={loading ? "..." : stats?.healthScore || "N/A"}
            icon={Heart}
            color="bg-rose-600"
            interactive
            onClick={() => setShowHealthGraph(true)}
            progress={loading ? 0 : (parseInt(stats?.healthScore) || 0)}
          />
        </section>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="patient-dashboard-panel relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-8 backdrop-blur-xl xl:col-span-2">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-100/80 via-slate-100/40 to-transparent" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-600">Patient Summary</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Your health information at a glance.</h2>
                <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
                  Review recent records, track active reminders, and keep your emergency profile up to date from one central dashboard.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Assigned Doctor</p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      {profile?.consultingDoctor ? `Dr. ${profile.consultingDoctor.name}` : 'Not assigned'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Emergency Contact</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{loading ? '...' : profile?.emergencyContact || 'Not updated'}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Active Reminders</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : stats?.activeReminders || '0'}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Scheduled medicine alerts currently running.</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Health Score</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : stats?.healthScore || 'N/A'}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Latest overall health indicator from your profile data.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="patient-dashboard-panel rounded-[2rem] border border-white/60 bg-white/75 p-7 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Quick Actions</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Need something fast?</h3>
              </div>
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/records')}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 text-left font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50"
              >
                View complete record library
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              </button>
              <button
                onClick={() => navigate('/reminders')}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 text-left font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50"
              >
                Manage reminders
                <CalendarClock className="h-5 w-5 text-emerald-600" />
              </button>
              <button
                onClick={() => setShowEditProfile(true)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 text-left font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-indigo-50"
              >
                Update emergency profile
                <User className="h-5 w-5 text-indigo-600" />
              </button>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8 animate-slide-up-fade" style={{animationDelay: '0.1s'}}>
            <section className="patient-dashboard-panel relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 p-8 backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-100/60 via-cyan-100/30 to-transparent opacity-80" />
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recent Medical History</h2>
                <button onClick={() => navigate('/records')} className="text-blue-600 text-sm font-bold hover:text-blue-700 hover:underline transition-colors">View All Directory</button>
              </div>
              <div className="space-y-6">
                {loading ? (
                  <p className="text-slate-400">Loading records...</p>
                ) : records.length > 0 ? (
                  records.slice(0, 3).map((record) => (
                    <div key={record.id} className="group flex items-center rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                      <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 transition-transform duration-300 group-hover:scale-110">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{record.title}</h4>
                        <p className="text-sm text-slate-500 font-medium">
                          {new Date(record.date).toLocaleDateString()} | <span className="uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1 font-bold">{record.type}</span>
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
            <section className="patient-dashboard-panel group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white shadow-2xl shadow-indigo-900/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-indigo-900/40">
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

            <section className="patient-dashboard-panel rounded-[2rem] border border-white/60 bg-white/75 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Inventory Watch</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Medicine Overview</h3>
                </div>
                <Pill className="h-7 w-7 text-amber-500" />
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50/90 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Total Items</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{loading ? '...' : inventory.length}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Low Stock</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{lowStockItems.length}</p>
                </div>
              </div>
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
      {showHealthGraph && (
        <HealthScoreModal
          profile={profile}
          stats={stats}
          onClose={() => setShowHealthGraph(false)}
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

export default PatientDashboard;
